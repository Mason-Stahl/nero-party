import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
let _io: Server;

export function initBroadcast(io: Server) {
  _io = io;
}

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
