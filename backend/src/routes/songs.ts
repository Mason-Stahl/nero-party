import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { env } from "../env.js";
import { broadcastQueue } from "../broadcast.js";

import { Request } from "express";
type P = { partyId: string; songId?: string };
const router = Router({ mergeParams: true }); // inherits :partyId
const prisma = new PrismaClient();

// ── YouTube helpers ───────────────────────────────────────────────────────────

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

interface YTMeta {
  title: string;
  artist: string;
  thumbnailUrl: string | null;
  durationSec:  number | null;
}

async function fetchYouTubeMeta(videoId: string): Promise<YTMeta | null> {
  if (!env.YOUTUBE_API_KEY) return null;
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${env.YOUTUBE_API_KEY}`;
  const res  = await fetch(url);
  const data = await res.json() as any;
  const item = data.items?.[0];
  if (!item) return null;

  // Parse ISO 8601 duration (PT3M45S → seconds)
  const dur = item.contentDetails?.duration ?? "";
  const m   = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const durationSec = m
    ? (parseInt(m[1] ?? "0") * 3600) + (parseInt(m[2] ?? "0") * 60) + parseInt(m[3] ?? "0")
    : null;

  return {
    title:        item.snippet.title,
    artist:       item.snippet.channelTitle,
    thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? null,
    durationSec,
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /parties/:partyId/songs — return queued + pending songs ordered by position
router.get("/", async (req: Request<P>, res) => {
  const { partyId } = req.params;
  const songs = await prisma.song.findMany({
    where:   { partyId, status: { in: ["queued", "pending", "playing"] } },
    orderBy: { position: "asc" },
    include: { addedBy: { select: { displayName: true } } },
  });
  return res.json(songs);
});

// POST /parties/:partyId/songs — add a song
router.post("/", async (req: Request<P>, res) => {
  const { partyId }                    = req.params;
  const { youtubeUrl, participantId }  = req.body;

  if (!youtubeUrl?.trim() || !participantId) {
    return res.status(400).json({ error: "youtubeUrl and participantId are required" });
  }

  const videoId = extractVideoId(youtubeUrl.trim());
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL" });

  const party = await prisma.party.findUnique({ where: { id: partyId } });
  if (!party)                      return res.status(404).json({ error: "Party not found" });
  if (party.status === "ended")    return res.status(410).json({ error: "Party has ended" });

  const participant = await prisma.participant.findFirst({
    where: { id: participantId, partyId },
  });
  if (!participant) return res.status(403).json({ error: "Not a member of this party" });

  // Enforce maxSongs limit
  if (party.maxSongs) {
    const count = await prisma.song.count({ where: { partyId, status: { in: ["queued", "pending", "playing"] } } });
    if (count >= party.maxSongs) return res.status(409).json({ error: "Queue is full" });
  }

  // Fetch YouTube metadata (falls back gracefully if no API key)
  const canonical = `https://www.youtube.com/watch?v=${videoId}`;
  const meta      = await fetchYouTubeMeta(videoId);

  // Determine next position
  const last = await prisma.song.findFirst({
    where:   { partyId, status: { in: ["queued", "pending"] } },
    orderBy: { position: "desc" },
    select:  { position: true },
  });
  const position = (last?.position ?? 0) + 1;

  const status = party.autoAccept ? "queued" : "pending";

  const song = await prisma.song.create({
    data: {
      partyId,
      addedByParticipantId: participantId,
      youtubeUrl:   canonical,
      title:        meta?.title        ?? `YouTube: ${videoId}`,
      artist:       meta?.artist       ?? "Unknown",
      thumbnailUrl: meta?.thumbnailUrl ?? null,
      durationSec:  meta?.durationSec  ?? null,
      status,
      position,
    },
    include: { addedBy: { select: { displayName: true } } },
  });

  await broadcastQueue(partyId);
  return res.status(201).json(song);
});

// DELETE /parties/:partyId/songs/:songId — ban a song (host only, enforced by participantId check)
router.delete("/:songId", async (req: Request<P & { songId: string }>, res) => {
  const { partyId, songId } = req.params;
  const { participantId }   = req.body;

  const party = await prisma.party.findUnique({ where: { id: partyId } });
  if (!party) return res.status(404).json({ error: "Party not found" });

  // Only host (first participant / hostName match) can ban — simple check
  const participant = await prisma.participant.findFirst({ where: { id: participantId, partyId } });
  if (!participant || participant.displayName !== party.hostName) {
    return res.status(403).json({ error: "Only the host can remove songs" });
  }

  const song = await prisma.song.update({
    where: { id: songId },
    data:  { status: "banned" },
  });

  await broadcastQueue(partyId);
  return res.json(song);
});

export default router;
