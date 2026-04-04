import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { env } from "../env.js";
import {
  broadcastQueue,
  broadcastPlayback,
  broadcastHistory,
  initPlayback,
  pausePlayback,
  resumePlayback,
} from "../broadcast.js";

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

// POST /parties/:partyId/songs/advance — advance queue (host only)
// Marks current playing song as played, promotes next queued song to playing.
router.post("/advance", async (req: Request<P>, res) => {
  const { partyId }       = req.params;
  const { participantId } = req.body;

  const party = await prisma.party.findUnique({ where: { id: partyId } });
  if (!party) return res.status(404).json({ error: "Party not found" });

  const participant = await prisma.participant.findFirst({ where: { id: participantId, partyId } });
  if (!participant || participant.displayName !== party.hostName) {
    return res.status(403).json({ error: "Only the host can advance the queue" });
  }

  // Mark current playing song as played
  await prisma.song.updateMany({
    where: { partyId, status: "playing" },
    data:  { status: "played" },
  });
  await broadcastHistory(partyId);

  // Promote next queued song
  const next = await prisma.song.findFirst({
    where:   { partyId, status: "queued" },
    orderBy: { position: "asc" },
  });

  if (next) {
    const now = new Date();
    await prisma.song.update({
      where: { id: next.id },
      data:  { status: "playing", startedAt: now },
    });
    initPlayback(partyId, now);
    broadcastPlayback(partyId);
  }

  await broadcastQueue(partyId);
  return res.json({ playing: next ?? null });
});

// POST /parties/:partyId/songs/:songId/approve — approve a pending song (host only)
router.post("/:songId/approve", async (req: Request<P & { songId: string }>, res) => {
  const { partyId, songId } = req.params;
  const { participantId }   = req.body;

  const party = await prisma.party.findUnique({ where: { id: partyId } });
  if (!party) return res.status(404).json({ error: "Party not found" });

  const participant = await prisma.participant.findFirst({ where: { id: participantId, partyId } });
  if (!participant || participant.displayName !== party.hostName) {
    return res.status(403).json({ error: "Only the host can approve songs" });
  }

  const song = await prisma.song.findFirst({ where: { id: songId, partyId, status: "pending" } });
  if (!song) return res.status(404).json({ error: "Pending song not found" });

  const updated = await prisma.song.update({
    where: { id: songId },
    data:  { status: "queued" },
  });

  await broadcastQueue(partyId);
  return res.json(updated);
});

// POST /parties/:partyId/songs/:songId/reject — reject a pending song (host only)
router.post("/:songId/reject", async (req: Request<P & { songId: string }>, res) => {
  const { partyId, songId } = req.params;
  const { participantId }   = req.body;

  const party = await prisma.party.findUnique({ where: { id: partyId } });
  if (!party) return res.status(404).json({ error: "Party not found" });

  const participant = await prisma.participant.findFirst({ where: { id: participantId, partyId } });
  if (!participant || participant.displayName !== party.hostName) {
    return res.status(403).json({ error: "Only the host can reject songs" });
  }

  const song = await prisma.song.findFirst({ where: { id: songId, partyId, status: "pending" } });
  if (!song) return res.status(404).json({ error: "Pending song not found" });

  const updated = await prisma.song.update({
    where: { id: songId },
    data:  { status: "banned" },
  });

  await broadcastQueue(partyId);
  return res.json(updated);
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

// POST /parties/:partyId/songs/pause — host pauses playback
router.post("/pause", async (req: Request<P>, res) => {
  const { partyId }       = req.params;
  const { participantId } = req.body;

  const party = await prisma.party.findUnique({ where: { id: partyId } });
  if (!party) return res.status(404).json({ error: "Party not found" });

  const participant = await prisma.participant.findFirst({ where: { id: participantId, partyId } });
  if (!participant || participant.displayName !== party.hostName) {
    return res.status(403).json({ error: "Only the host can pause" });
  }

  const state = pausePlayback(partyId);
  if (!state) return res.status(409).json({ error: "Already paused or no song playing" });

  broadcastPlayback(partyId);
  return res.json({ isPaused: true });
});

// GET /parties/:partyId/songs/history — played songs with ratings
router.get("/history", async (req: Request<P>, res) => {
  const { partyId } = req.params;
  const songs = await prisma.song.findMany({
    where:   { partyId, status: "played" },
    orderBy: { startedAt: "asc" },
    include: {
      addedBy: { select: { displayName: true } },
      ratings: { select: { stars: true, participantId: true } },
    },
  });
  return res.json(songs);
});

// POST /parties/:partyId/songs/:songId/rate — submit or update a rating
router.post("/:songId/rate", async (req: Request<P & { songId: string }>, res) => {
  const { partyId, songId } = req.params;
  const { participantId, stars } = req.body;  // stars: 0.5–5.0 float

  if (!participantId || stars == null) {
    return res.status(400).json({ error: "participantId and stars are required" });
  }
  const starsInt = Math.round(Number(stars) * 2);  // 1–10
  if (starsInt < 1 || starsInt > 10) {
    return res.status(400).json({ error: "stars must be between 0.5 and 5" });
  }

  const participant = await prisma.participant.findFirst({ where: { id: participantId, partyId } });
  if (!participant) return res.status(403).json({ error: "Not a member of this party" });

  const song = await prisma.song.findFirst({ where: { id: songId, partyId, status: "played" } });
  if (!song) return res.status(404).json({ error: "Song not found or not played yet" });

  if (song.addedByParticipantId === participantId) {
    return res.status(403).json({ error: "Cannot rate your own song" });
  }

  await prisma.rating.upsert({
    where:  { songId_participantId: { songId, participantId } },
    create: { songId, participantId, stars: starsInt },
    update: { stars: starsInt },
  });

  await broadcastHistory(partyId);
  return res.json({ ok: true });
});

// POST /parties/:partyId/songs/resume — host resumes playback
router.post("/resume", async (req: Request<P>, res) => {
  const { partyId }       = req.params;
  const { participantId } = req.body;

  const party = await prisma.party.findUnique({ where: { id: partyId } });
  if (!party) return res.status(404).json({ error: "Party not found" });

  const participant = await prisma.participant.findFirst({ where: { id: participantId, partyId } });
  if (!participant || participant.displayName !== party.hostName) {
    return res.status(403).json({ error: "Only the host can resume" });
  }

  const state = resumePlayback(partyId);
  if (!state) return res.status(409).json({ error: "Not paused" });

  broadcastPlayback(partyId);
  return res.json({ isPaused: false, effectiveStartTime: state.effectiveStartTime });
});

export default router;
