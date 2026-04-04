-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "joinCode" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "codeword" TEXT,
    "vibe" TEXT,
    "status" TEXT NOT NULL DEFAULT 'lobby',
    "maxSongs" INTEGER,
    "timeLimitMin" INTEGER,
    "autoAccept" BOOLEAN NOT NULL DEFAULT true,
    "maxSongLengthSec" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "socketId" TEXT,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Participant_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT NOT NULL,
    "addedByParticipantId" TEXT NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "durationSec" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "position" INTEGER,
    "playedAt" DATETIME,
    CONSTRAINT "Song_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Song_addedByParticipantId_fkey" FOREIGN KEY ("addedByParticipantId") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "songId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    CONSTRAINT "Rating_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rating_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChatMessage_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Party_joinCode_key" ON "Party"("joinCode");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_songId_participantId_key" ON "Rating"("songId", "participantId");
