import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
let _io: Server;

export function initBroadcast(io: Server) {
  _io = io;
}

// ── Queue + Participants ──────────────────────────────────────────────────────

export async function broadcastQueue(partyId: string) {
  const songs = await prisma.song.findMany({
    where:   { partyId, status: { in: ["queued", "pending", "playing"] } },
    orderBy: { position: "asc" },
    include: { addedBy: { select: { displayName: true } } },
  });
  _io.to(partyId).emit("queue-updated", songs);
}

export async function broadcastParticipants(partyId: string) {
  const participants = await prisma.participant.findMany({
    where:   { partyId, isBanned: false },
    select:  { id: true, displayName: true, joinedAt: true },
    orderBy: { joinedAt: "asc" },
  });
  _io.to(partyId).emit("participants-updated", participants);
}

// ── Playback state ────────────────────────────────────────────────────────────
// Tracks pause/resume per party in memory.
// effectiveStartTime: "virtual" start that shifts forward by pause duration on each resume.
// Client computes: elapsedSec = (Date.now() - effectiveStartTime) / 1000

interface PlaybackState {
  effectiveStartTime: number;  // ms since epoch
  isPaused:           boolean;
  pausedAt?:          number;  // ms since epoch, set while paused
}

const partyPlayback = new Map<string, PlaybackState>();

export function initPlayback(partyId: string, startedAt: Date) {
  partyPlayback.set(partyId, {
    effectiveStartTime: startedAt.getTime(),
    isPaused: false,
  });
}

export function pausePlayback(partyId: string): PlaybackState | null {
  const state = partyPlayback.get(partyId);
  if (!state || state.isPaused) return null;
  state.isPaused = true;
  state.pausedAt = Date.now();
  return state;
}

export function resumePlayback(partyId: string): PlaybackState | null {
  const state = partyPlayback.get(partyId);
  if (!state || !state.isPaused || state.pausedAt == null) return null;
  const pausedDurationMs = Date.now() - state.pausedAt;
  state.effectiveStartTime += pausedDurationMs;  // shift start forward, absorbing the pause
  state.isPaused = false;
  state.pausedAt = undefined;
  return state;
}

export function getPlaybackState(partyId: string): PlaybackState | null {
  return partyPlayback.get(partyId) ?? null;
}

export function broadcastPlayback(partyId: string) {
  const state = partyPlayback.get(partyId);
  if (!state) return;
  _io.to(partyId).emit("playback-updated", {
    effectiveStartTime: state.effectiveStartTime,
    isPaused:           state.isPaused,
  });
}

export function emitPlaybackToSocket(socketId: string, partyId: string) {
  const state = partyPlayback.get(partyId);
  if (!state) return;
  _io.to(socketId).emit("playback-updated", {
    effectiveStartTime: state.effectiveStartTime,
    isPaused:           state.isPaused,
  });
}

// ── History ───────────────────────────────────────────────────────────────────

export async function broadcastHistory(partyId: string) {
  const songs = await prisma.song.findMany({
    where:   { partyId, status: "played" },
    orderBy: { startedAt: "asc" },
    include: {
      addedBy: { select: { displayName: true } },
      ratings: { select: { stars: true, participantId: true } },
    },
  });
  _io.to(partyId).emit("history-updated", songs);
}
