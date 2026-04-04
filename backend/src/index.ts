import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";
import {
  initBroadcast,
  broadcastParticipants,
  getPlaybackState,
  initPlayback,
  emitPlaybackToSocket,
} from "./broadcast.js";
import partiesRouter from "./routes/parties.js";
import songsRouter from "./routes/songs.js";

const app    = express();
const server = createServer(app);
const prisma = new PrismaClient();

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

initBroadcast(io);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/parties", partiesRouter);
app.use("/parties/:partyId/songs", songsRouter);

// ── Socket.IO ─────────────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-party", async ({ partyId, participantId }: { partyId: string; participantId: string }) => {
    const participant = await prisma.participant.findFirst({
      where: { id: participantId, partyId },
    });
    if (!participant) return;

    socket.join(partyId);

    await prisma.participant.update({
      where: { id: participantId },
      data:  { socketId: socket.id },
    });

    await broadcastParticipants(partyId);

    // Restore in-memory playback state from DB if server restarted
    if (!getPlaybackState(partyId)) {
      const playing = await prisma.song.findFirst({
        where: { partyId, status: "playing" },
      });
      if (playing?.startedAt) {
        initPlayback(partyId, playing.startedAt);
      }
    }
    // Send current playback state to the joining socket only
    emitPlaybackToSocket(socket.id, partyId);

    console.log(`${participant.displayName} joined room ${partyId}`);
  });

  socket.on("send-message", async ({ partyId, participantId, body }: { partyId: string; participantId: string; body: string }) => {
    if (!body?.trim()) return;
    const participant = await prisma.participant.findFirst({
      where: { id: participantId, partyId, isBanned: false },
    });
    if (!participant) return;
    const message = await prisma.chatMessage.create({
      data: {
        partyId,
        participantId,
        displayName: participant.displayName,
        body:        body.trim(),
      },
    });
    io.to(partyId).emit("chat-message", message);
  });

  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);

    const participant = await prisma.participant.findFirst({
      where: { socketId: socket.id },
    });
    if (!participant) return;

    await prisma.participant.update({
      where: { id: participant.id },
      data:  { socketId: null },
    });

    await broadcastParticipants(participant.partyId);
  });
});

server.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
