# Nero Party

A listening party app where friends join, add songs, listen together, and crown a winning song.

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- YouTube Data API v3 key ([get one free from Google Cloud Console](https://console.cloud.google.com/) — search quota is generous, song lookups won't come close to the limit)

### Installation

```bash
# Install all dependencies (run from project root)
npm install

# Set up environment variables
cp .env.example .env
# Then open .env and replace YOUTUBE_API_KEY with your key

# Set up the database
cd backend && npx prisma migrate dev && cd ..

# Start the development servers
npm run dev
```

This will start:
- Backend on `http://localhost:3000`
- Frontend on `http://localhost:5173` — open this in your browser

## Project Structure

```
nero-party/
├── backend/
│   ├── prisma/                  # Prisma schema & SQLite DB
│   └── src/
│       ├── routes/
│       │   ├── parties.ts       # Party CRUD endpoints
│       │   └── songs.ts         # Song queue/rating endpoints
│       ├── broadcast.ts         # Socket.IO event helpers
│       ├── env.ts               # Environment config
│       └── index.ts             # Express + Socket.IO server entry
└── frontend/
    ├── public/images/           # Background & stage assets
    └── src/
        ├── components/
        │   ├── Introduction/    # Intro animation, dialog, host/join forms
        │   ├── Peripherals/     # GroupChat, History, Playlist, SlideDrawer, StarRating
        │   ├── AddSong.jsx
        │   ├── MixingTable.jsx  # Host-only DJ controls
        │   ├── Notes.jsx        # Staff visualization
        │   ├── Player.jsx       # YouTube IFrame player (synced)
        │   ├── Queue.jsx
        │   └── Scoreboard.jsx
        ├── context/
        │   └── PartyContext.jsx # Global session identity (partyId, participantId, isHost)
        ├── lib/
        │   └── socket.ts        # Socket.IO client instance
        └── pages/
            └── StagePage.jsx    # Main party view
```

## Tech Stack

- **Backend:** Express.js, Prisma, Socket.IO
- **Frontend:** React, Vite, TailwindCSS
- **Database:** SQLite (local)
- **External API:** YouTube Data API v3
