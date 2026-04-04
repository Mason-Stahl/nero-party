import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { broadcastParticipants, broadcastPartyEnded } from "../broadcast.js";

const router = Router();
const prisma = new PrismaClient();

// Generate a short human-readable join code like "NERO42"
function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I confusion
  const prefix = "NERO";
  const suffix = Array.from({ length: 2 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return prefix + suffix;
}

// POST /parties — host creates a new party
router.post("/", async (req, res) => {
  const {
    hostName,
    groupName,
    isPrivate = false,
    codeword,
    vibe,
    maxSongs,
    timeLimitMin,
    autoAccept = true,
    maxSongLengthSec,
  } = req.body;

  if (!hostName?.trim() || !groupName?.trim()) {
    return res.status(400).json({ error: "hostName and groupName are required" });
  }

  // Retry on the rare joinCode collision
  let joinCode = generateJoinCode();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.party.findUnique({ where: { joinCode } });
    if (!exists) break;
    joinCode = generateJoinCode();
  }

  const party = await prisma.party.create({
    data: {
      joinCode,
      hostName: hostName.trim(),
      groupName: groupName.trim(),
      isPrivate,
      codeword: isPrivate ? codeword?.trim() || null : null,
      vibe: vibe?.trim() || null,
      maxSongs:         maxSongs         ?? null,
      timeLimitMin:     timeLimitMin     ?? null,
      autoAccept,
      maxSongLengthSec: maxSongLengthSec ?? null,
    },
  });

  // Auto-add the host as the first participant
  const host = await prisma.participant.create({
    data: {
      partyId:     party.id,
      displayName: party.hostName,
    },
  });

  return res.status(201).json({ party, participantId: host.id });
});

// GET /parties — list all active/lobby parties with participant count
router.get("/", async (_req, res) => {
  const parties = await prisma.party.findMany({
    where: { status: { not: "ended" } },
    orderBy: { createdAt: "desc" },
    select: {
      id:        true,
      joinCode:  true,
      groupName: true,
      hostName:  true,
      isPrivate: true,
      vibe:      true,
      status:    true,
      _count:    { select: { participants: true } },
    },
  });
  return res.json(parties);
});

// GET /parties/:joinCode — look up a party before joining
router.get("/:joinCode", async (req, res) => {
  const party = await prisma.party.findUnique({
    where: { joinCode: req.params.joinCode.toUpperCase() },
    select: {
      id:        true,
      joinCode:  true,
      groupName: true,
      hostName:  true,
      isPrivate: true,
      vibe:      true,
      status:    true,
    },
  });

  if (!party) return res.status(404).json({ error: "Party not found" });
  return res.json(party);
});

// POST /parties/:joinCode/join — participant joins an existing party
router.post("/:joinCode/join", async (req, res) => {
  const { displayName, codeword } = req.body;

  if (!displayName?.trim()) {
    return res.status(400).json({ error: "displayName is required" });
  }

  const party = await prisma.party.findUnique({
    where: { joinCode: req.params.joinCode.toUpperCase() },
  });

  if (!party) return res.status(404).json({ error: "Party not found" });
  if (party.status === "ended") return res.status(410).json({ error: "Party has ended" });

  if (party.isPrivate && party.codeword !== codeword?.trim()) {
    return res.status(403).json({ error: "Wrong codeword" });
  }

  const participant = await prisma.participant.create({
    data: {
      partyId:     party.id,
      displayName: displayName.trim(),
    },
  });

  return res.status(201).json({ party, participantId: participant.id });
});

// PATCH /parties/:partyId — host updates party settings (autoAccept, maxSongLengthSec)
router.patch("/:partyId", async (req, res) => {
  const { partyId }                            = req.params;
  const { participantId, autoAccept, maxSongLengthSec } = req.body;

  const party = await prisma.party.findUnique({ where: { id: partyId } });
  if (!party) return res.status(404).json({ error: "Party not found" });

  const participant = await prisma.participant.findFirst({ where: { id: participantId, partyId } });
  if (!participant || participant.displayName !== party.hostName) {
    return res.status(403).json({ error: "Only the host can update party settings" });
  }

  const updated = await prisma.party.update({
    where: { id: partyId },
    data: {
      ...(autoAccept       !== undefined && { autoAccept }),
      ...(maxSongLengthSec !== undefined && { maxSongLengthSec: maxSongLengthSec ?? null }),
    },
  });

  return res.json(updated);
});

// POST /parties/:partyId/end — host ends the party
router.post("/:partyId/end", async (req, res) => {
  const { partyId }       = req.params;
  const { participantId } = req.body;

  const party = await prisma.party.findUnique({ where: { id: partyId } });
  if (!party) return res.status(404).json({ error: "Party not found" });

  const participant = await prisma.participant.findFirst({ where: { id: participantId, partyId } });
  if (!participant || participant.displayName !== party.hostName) {
    return res.status(403).json({ error: "Only the host can end the party" });
  }

  await prisma.party.update({
    where: { id: partyId },
    data:  { status: "ended", endedAt: new Date() },
  });

  broadcastPartyEnded(partyId);
  return res.json({ ended: true });
});

// DELETE /parties/:partyId/participants/:pid — host kicks a participant
router.delete("/:partyId/participants/:pid", async (req, res) => {
  const { partyId, pid }  = req.params;
  const { participantId } = req.body;

  const party = await prisma.party.findUnique({ where: { id: partyId } });
  if (!party) return res.status(404).json({ error: "Party not found" });

  const requester = await prisma.participant.findFirst({ where: { id: participantId, partyId } });
  if (!requester || requester.displayName !== party.hostName) {
    return res.status(403).json({ error: "Only the host can kick participants" });
  }

  await prisma.participant.update({
    where: { id: pid },
    data:  { isBanned: true },
  });

  await broadcastParticipants(partyId);
  return res.json({ kicked: pid });
});

// GET /parties/:partyId/messages — fetch chat history for a party
router.get("/:partyId/messages", async (req, res) => {
  const { partyId } = req.params;
  const messages = await prisma.chatMessage.findMany({
    where:   { partyId },
    orderBy: { sentAt: "asc" },
  });
  return res.json(messages);
});

export default router;
