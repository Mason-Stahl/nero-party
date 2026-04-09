## Requirements

**Must have:**
- Create a party (with configurable conditions like: max song limit, max time limit, or whatever else you think is useful for a host)
- Shareable way to join a party
- Add songs to the queue (integrate with a music API of your choice for search/playback)
- Songs play for all participants
- Real-time updates (queue changes, current song, participants)
- A winning song at the end

## Tech Stack

Use the provided starter repo which includes:
- **Backend:** Express.js, Prisma, Socket.IO (basic boilerplate)
- **Frontend:** React, Vite, TailwindCSS (basic boilerplate)
- **Database:** SQLite (local, no setup required)
- **Playback:** Youtube URLS 
- **Search:** LastFM

# Tech Structure 

## dev.db
Party — joinCode (shareable), host config (maxSongs, timeLimitMin, autoAccept, maxSongLengthSec), status lifecycle
Participant — ephemeral, no auth, socketId for reconnect, isBanned for kick
Song — status: pending→queued→playing→played/skipped/banned, position for ordering; addedByParticipantId FK enables rating exclusion rule; startedAt set when status→playing (used for late-join seek + server-restart recovery)
Rating — 2–10 int (0.5-star steps), unique constraint prevents double-voting
ChatMessage — displayName denormalized so chat reads don't need a join

## Backend routes (backend/src/routes/parties.ts)
- POST /parties — create party, auto-add host as participant, return { party, participantId }
- GET /parties — list active/lobby parties with _count.participants
- GET /parties/:joinCode — look up party before joining
- POST /parties/:joinCode/join — join party, returns { party, participantId }
- PATCH /:partyId — host updates autoAccept and/or maxSongLengthSec
- DELETE /:partyId/participants/:pid — host kicks participant (isBanned=true), broadcastParticipants
- POST /:partyId/end — host ends party; sets status="ended", broadcasts party-ended to room

## Songs backend (backend/src/routes/songs.ts)
- GET /parties/:partyId/songs — queued+pending+playing ordered by position
- GET /history — returns songs with status="played", ordered by startedAt asc, includes ratings[] + addedBy
- POST /parties/:partyId/songs — extract video ID, fetch YouTube Data API v3 metadata, create Song, broadcastQueue
  - Auto-start: if no song is currently "playing", immediately promotes new song to playing and calls initPlayback+broadcastPlayback
  - Enforces maxSongs limit, validates participant membership
- POST /advance (host-only) — flips playing→played, promotes next queued→playing, sets startedAt, initPlayback+broadcastPlayback+broadcastQueue
  - Optional body `targetSongId`: skip directly to a specific queued song — all queued songs with createdAt < target are marked "played" (skipped over), target becomes playing
- POST /rewind (host-only) — flips playing→queued, restores last "played" song→playing with new startedAt; route must be defined BEFORE /:songId to avoid Express matching "rewind" as a songId
  - Optional body `targetSongId`: rewind to a specific played song — current playing + all songs with startedAt ≥ target.startedAt are restored to "queued" (startedAt cleared), target becomes playing
- POST /pause (host-only) — pausePlayback, broadcastPlayback
- POST /resume (host-only) — resumePlayback (shifts effectiveStartTime forward), broadcastPlayback
- POST /:songId/approve (host-only) — pending → queued, broadcastQueue
- POST /:songId/reject (host-only) — pending → banned, broadcastQueue
- POST /:songId/rate — submit/update rating; body: { participantId, stars (0.5–5.0) }; converts to int (×2); blocks own-song; upserts Rating; broadcastHistory
- DELETE /:songId (host-only) — ban song (status="banned")

## Socket.IO events (backend/src/index.ts)
- client emits `join-party` { partyId, participantId } → socket joins room, socketId saved, broadcasts participants-updated; server calls emitPlaybackToSocket for late-join sync
- client emits `send-message` { partyId, participantId, body } → server validates, persists ChatMessage, broadcasts chat-message to room
- server emits `participants-updated`, `queue-updated`, `playback-updated`, `history-updated`, `chat-message`, `party-ended`
- disconnect → clears socketId, re-broadcasts participants

## broadcast.ts (backend/src/broadcast.ts)
- initBroadcast(io) called once at startup
- broadcastQueue / broadcastParticipants / broadcastHistory — shared helpers used by routes + socket handlers
- partyPlayback: Map<partyId, { effectiveStartTime, isPaused, pausedAt? }> — in-memory
- effectiveStartTime: "virtual" start time that shifts forward by pause duration on each resume
- initPlayback / pausePlayback / resumePlayback — called by route handlers
- broadcastPlayback(partyId) — emits playback-updated to room
- emitPlaybackToSocket(socketId, partyId) — targeted emit for late-join sync; recovers from DB if in-memory map is missing (server restart)

## PartyContext (frontend/src/context/PartyContext.jsx)
- `<PartyProvider data={hostData}>` wraps StagePage in App.tsx once onComplete fires
- `useParty()` returns `{ partyId, participantId, isHost, joinCode, groupName, hostName, autoAccept, maxSongLengthSec }`
- All stage components read session identity from context — no prop drilling

## StagePage (frontend/src/pages/StagePage.jsx)
- Reads partyId + participantId from useParty()
- Connects socket on mount, emits join-party
- Listens for: participants-updated, queue-updated, playback-updated, history-updated, chat-message, party-ended
- Fetches initial queue + history + messages on mount
- `autoAccept` state lifted here (initialized from PartyContext), passed to MiddleZone and HostSettings
- Winner popup: computed from history ratings, shown when host ends party
- Layout split into three absolute zones: TopBar (0–20%), MiddleZone (20–70%), BottomBar (70–100%)
- Mobile layout: MobileNavbar at bottom, pages for home/vote/chat stacked full-screen
- HostSettings rendered as fixed overlay (zIndex 100) when gear icon is clicked

## Layout components (frontend/src/components/Layouts/)

### TopBar
- Scoreboard (status bar) at the top
- Host-only gear icon opens HostSettings overlay

### MiddleZone
- **Both host and guest** see the same Queue carousel with a 76px controls strip at the bottom
- Both paths track `focusedSong` via `Queue.onFocusedChange` and pass it to `<PlaybackControls>`
- Host: full playback controls + VoteButton; Guest: VoteButton only
- `handleSkipTo(targetSongId)` / `handleRewindTo(targetSongId)` POST to /advance and /rewind with the target in body

### BottomBar
- SCOREBOARD CircleBtn (left, opens History slide-out), AddSong (center), GROUP CHAT CircleBtn (right)

## Queue carousel (frontend/src/components/Queue.jsx)
- Shows all songs: history (left) ← now playing (center) → upcoming (right)
- allSongs built as: `[...history_sorted_by_startedAt, playing, ...queued_sorted_by_createdAt]` — guarantees new songs always land to the right
- `cardSize` = responsive size for vinyl disc cards (max 400px); now-playing card uses `cardSize × 1.3` (NOW_SCALE)
- Side cards pushed outward by `(nowCardSize - cardSize) / 2` (extraPush) to maintain consistent visual overlap with the larger center card
- `TOP_OFFSET = 17` shifts all cards down slightly to center in the space below the nav buttons
- 5 cards visible on each side (offsets ±1 through ±5); now-playing card always mounted (even at offset >5) with opacity:0 to keep the iframe alive
- HISTORY label top-left, UPCOMING label top-right, both at 16% from edge
- Nav buttons (‹ JUMP TO PRESENT ›) at top:0, centered — styled with CircleBtn-style hover (NavCircleBtn + JumpBtn local components)
- Wheel scroll steps through cards (380ms throttle)
- **Focused song tracked by ID (`focusedId` state), not index** — position stays stable when allSongs reorders (songs added, song advances, rewind)
- Auto-follow: only jumps to now-playing when the user was already at the now-playing card; browsing is not interrupted by queue/playback updates
- `onFocusedChange(song)` prop — called whenever the center card changes; used by MiddleZone to drive PlaybackControls
- Imports: QueueCard, local NavCircleBtn, JumpBtn

## QueueCard (frontend/src/components/QueueCard.jsx)
- Now-playing card: 16:9 video area (cardSize × cardSize×9/16) + 64px info bar below (black bg, NOW PLAYING label, title, artist, LIVE/PAUSED badge)
- Vinyl disc cards: square (cardSize × cardSize), thumbnail bg, centered VinylDisc, title/artist gradient overlay at bottom
- Border: focused = rgba(255,255,255,0.18), unfocused = rgba(255,255,255,0.07); no glow/shadow
- No reflection
- Imports: NowPlayingIframe, VinylDisc

## NowPlayingIframe (frontend/src/components/NowPlayingIframe.jsx)
- YouTube IFrame API player; loaded once via script tag injection (loadYTScript / whenYTReady)
- playerVars: autoplay:1, controls:0, disablekb:1, fs:0, iv_load_policy:3 — no native YT controls
- Transparent blocker div overlaid on iframe — all playback controlled via host's CircleBtns only
- On song change: recreates YT.Player with start=elapsedSec (late-join seek)
- On isPaused/effectiveStartTime change: pauseVideo() or seekTo(elapsed)+playVideo()
- Exports: default NowPlayingIframe, named extractVideoId

## VinylDisc (frontend/src/components/VinylDisc.jsx)
- SVG vinyl disc with groove rings; center circle glows purple (rgb(120,80,255)) when spinning
- Thumbnail image inset at center (30% radius circle)
- `spinning` prop drives `vinyl-spin` CSS animation (defined in Queue.jsx's SPIN_CSS injection)

## PlaybackControls (frontend/src/components/PlaybackControls.jsx)
- Renders for both host and guest; non-hosts see only the VoteButton
- **VoteButton** sub-component: CircleBtn (star icon, label "VOTE"); on click opens a DarkPanel callout above it with StarRating + primary Btn submit; resets on focusedSong change; blocks own-song rating; shows "Rated ✓" if already submitted; only enabled for `playing` or `played` songs
- Three host states driven by `focusedSong.status` (all include VoteButton):
  - `queued` / `pending` → **SKIP TO** + VoteButton
  - `played` → **REWIND TO** + VoteButton
  - `playing` / `null` → full controls: APPROVE (if !autoAccept, with pending badge), REWIND, PAUSE/PLAY, NEXT, REJECT (if !autoAccept), VoteButton
- All disabled states computed internally from `songs`, `history`, `loading`, `currentSong`
- Contains all playback SVG icon definitions (IconRewind, IconPlay, IconPause, IconNext, IconCheck, IconX, IconStar)

## CircleBtn (frontend/src/components/CircleBtn.jsx)
- 48×48 circular icon button; `disabled` prop dims + blocks clicks
- `badge` prop shows green dot (top-right) with count (9+ when >9)
- `label` prop renders small uppercase text below the circle; omit to hide
- Used for playback controls in MiddleZone and utility buttons in BottomBar

## HostSettings (frontend/src/pages/HostSettings.jsx)
- Full-screen overlay with side nav: Invite | Queue Settings | Banning | Party Management
- **Invite**: shows joinCode + party link
- **Queue Settings**: CircleBtn auto-accept toggle (PATCH /parties/:partyId); pill buttons for max song length (OFF/1:00/2:00/3:00/5:00/10:00)
- **Banning**: list of rejected/skipped songs with Ban Song + Kick User per row
- **Party Management**: two-click confirm End Party (POST /parties/:partyId/end → onEndParty + onGoToStage)
- Props: autoAccept, onToggleAutoAccept, history, participants, onEndParty, onGoToStage

## History (frontend/src/components/Peripherals/History.jsx)
- Left-side slide-out portal panel (360px); DarkPanel color scheme (`#1e1e1e → #111` gradient)
- Scoreboard at top, then song list chronologically; click to expand inline RatingBox
- RatingBox: shows artist + duration, "your song" badge, StarRating widget → POST /:songId/rate
- StarRating: 0.5-step half-star widget (0.5–5.0 display = 1–10 DB int); readOnly mode for display
- Header has EXPORT button via Playlist component (downloads playlist.json)

## GroupChat (frontend/src/components/Peripherals/GroupChat.jsx)
- Right-side portal slide-out (320px); DarkPanel color scheme (`#1e1e1e → #111` gradient)
- Own messages: left-aligned, green-tinted bubble (`rgba(74,222,128,0.13)` + green border)
- Other messages: right-aligned, neutral bubble (`rgba(255,255,255,0.07)`)
- Header + input bar use `rgba(255,255,255,0.03)` tray background; send button uses green accent
- Unread count increments while closed, resets on open, auto-scrolls to latest
- Input + circular send button; Enter to send

## Scoreboard (frontend/src/components/Scoreboard.jsx)
- Fixed panel — group name · join code | live status + LEAVE button
- One row per participant sorted by avg rating desc; bar width proportional to leader

## AddSong (frontend/src/components/AddSong.jsx)
- Two modes: Search (typeahead via SongSearch) and URL paste
- Green "+ Add" activates when a track is selected or URL non-empty
- SongSearch: LastFM via backend proxy, 300ms debounce, dropdown renders above input

## SongCache (backend DB + songs.ts)
- Global cross-party cache keyed by SHA-256(artist.lower()|title.lower()).slice(0,24)
- Cache hit → 0 YouTube API calls; cache miss → search.list + videos.list → stored permanently

## Shared UI primitives
- **DarkPanel** — dark gradient bg, 1px border; `clip` prop for overflow:hidden; `DarkDivider` named export
- **GlassPanel** — frosted glass bg + backdrop-filter; used for dropdowns, lobby cards
- **Input** — wraps native input, manages focus state, applies shared inputStyle
- **Btn** — ghost/primary/danger variants, sm/md/lg sizes, hover scale + shadow

## Notes (frontend/src/components/Notes.jsx)
- SVG staff visualization: songs as beamed eighth note pairs on 4 horizontal staff lines
- Title rect on beam (marquee when overflow); channel rect below; even/odd songs alternate staff lines
- First song green, rest white

## DiaglogSequence (frontend/src/pages/DialogSequence.jsx)
- Adds isHost: true to data passed to onComplete on the host path
- Join flow data never sets it, so it stays falsy

## Frontend flows
- HostForm POSTs → onSubmit receives full party + participantId
- JoinForm fetches GET /parties list, POST /parties/:joinCode/join on selection
- onComplete → App wraps StagePage in `<PartyProvider>` → all components access session via useParty()
- New song added → backend auto-starts if nothing playing (initPlayback + broadcastPlayback)
- Host presses NEXT → advance route transitions songs atomically → broadcastQueue + broadcastHistory → carousel updates
- Song rated → POST /:songId/rate → broadcastHistory → all clients see updated avg stars
- Host ends party → POST /end → party-ended socket event → winner popup shown from StagePage state

## .env (root)
- PORT=3000
- YOUTUBE_API_KEY= (Google Cloud Console → YouTube Data API v3)
