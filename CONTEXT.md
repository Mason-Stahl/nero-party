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

## src/components 
### Main components (TO BUILD)

### Main components (COMPLETE)
**groupchat** - Real-time party chat. Right-side SlideDrawer-style portal (custom tab, not DogEar). Tab is a smartphone silhouette SVG with "GROUPCHAT" label and red unread-count badge circle. Tab top position matches History: `top: 10%` for host, `top: 50%` (centered) for guest. Panel slides in from right (320px). Own messages on LEFT (green bubbles), others on RIGHT (dark purple). Display name above each bubble. Input + circular send button at bottom; Enter to send. Unread count increments while closed, resets on open, auto-scrolls to latest.
- Socket: client emits `send-message` { partyId, participantId, body } → server validates, persists ChatMessage, broadcasts `chat-message` to room
- REST: GET /parties/:partyId/messages — fetches full history on mount (ordered sentAt asc)
- StagePage manages `messages` state, fetches on mount, listens for `chat-message`, passes `onSendMessage` callback to GroupChat

**scoreboard** - Fixed panel at top-center of StagePage (absolute, z=10). Three sections:
- Top bar: `GROUPNAME · JOINCODE` left, `● live / ○ connecting…` + LEAVE button right. LEAVE reloads page (returns to intro).
- Score chart: one row per participant, sorted by avg rating desc. Bar width proportional to leader's score. Score = avg stars across all their played songs (DB int ÷ 2). Shows `–` and empty bar until rated.
- "No scores yet — rate played songs in History" placeholder shown above rows until any participant has a score; disappears once scoring begins. WINNER label appears in header at that point.
- Props: `songs` (history), `participants`, `connected`. Reads `groupName`/`joinCode` from `useParty()`.

### Main Components (COMPLETE)
**history** - Guitar Hero 3 lined-paper slide-in drawer. Left-side tab (dog-ear, cream colored, black border) positioned at top 10% for host, vertically centered for guest. Clicking tab slides in a 30vw panel. Songs listed chronologically (#1 at top), numbered left margin, red vertical margin line. Click song to expand inline RatingBox. Panel hides on outside click. Header has EXPORT button (top-right) via Playlist component.
*RatingBox* - inline within History. Shows artist + duration, "your song" badge + can't-rate-own enforcement. StarRating widget + Rate button → POST /:songId/rate.
*StarRating* - 0.5-step half-star widget (0.5–5.0 display = 1–10 DB int). readOnly mode for display.
*Playlist* - EXPORT button in History header. Downloads `playlist.json` with `{ name, channel, url }` per played song. Disabled when no songs.

### Helper/Reusable Components (COMPLETE)
**SlideDrawer** - Generic slide-in panel with dog-ear tab, mounted via React portal. Props: side ("left"|"right"), tabTop (CSS), tabYOffset (CSS), tabLabel, tabSubtext, panelWidth, minWidth, children. Left tabs cut top-right corner; right tabs cut top-left. Uses createPortal to escape StagePage's overflow:hidden stacking context.

### Helper/Formatting/Intro Components (COMPLETE)
**notes** - either eigth or beamed eigth notes. (semiquaver when subtext is necessary) <br> The title of the track and channel goes in that beam that defines eigth note.
**queue** - barchart, leftmost note is next to be played. Display 5 at a time, with button to show more. 
*AddSong* - sits inside queue. Textbox to insert URL of youtube video. or
(to be built) *SearchBar* -  pulls from LastFM+MusicBrainz+Discogs for autofill -> converts to youtube link. (to youtube playback will be challange!) (searchbar may be scrapped)
**Player** - (MAY CHANGE TO ALBUM ART or Thumbnail image) get video feed and display it on a 'tv' in the club. 
**MixingTable** - Left spinner now playing, right spinner up next (ability to preview up next w/ button). Internal squares manage <br>-auto accept, max song length, Y/N song approval, ban song (prevent spam), group managemenet, - kick from group

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

## Socket.IO events (backend/src/index.ts)
- client emits `join-party` { partyId, participantId } → socket joins room, socketId saved, broadcasts participants-updated
- server emits `participants-updated` [{ id, displayName, joinedAt }] to room on join/disconnect
- disconnect → clears socketId, re-broadcasts

## Notes (frontend/src/components/Notes.jsx)
- SVG staff visualization: 4 horizontal staff lines, songs as beamed eighth note pairs
- Render order: beam/stems/noteheads first, then rects + text on top (prevents overlap)
- Each song: two noteheads + stems + beam; title rect on beam; channel rect directly below title rect
- Title rect: colored (green=next, white=rest); black text; continuous marquee loop when text overflows
  - Marquee: two text copies side-by-side, animate 0 → -loopW infinitely (~30px/s, speed scales with length)
  - Always scrolling for song 1; hover-triggered for rest
  - Hover zone spans full height of title+channel rects (not just title)
- Channel rect: same color, 80% opacity; truncated artist/addedBy name
- Even/odd songs alternate staff lines (y=84 / y=96) for staggered look
- First song green; rest white
- Props: songs[]

## Queue (frontend/src/components/Queue.jsx)
- Container for Notes + AddSong; shows 5 songs at a time with "show more" toggle
- Horizontally scrollable if songs overflow

## AddSong (frontend/src/components/AddSong.jsx)
- Two modes toggled by a small link at the bottom-right:
  - **Search mode** (default): renders `<SongSearch>` typeahead; on selection stores `{ name, artist }`; submits `{ title, artist, participantId }` → backend resolves to YouTube
  - **URL mode**: original YouTube URL paste input; submits `{ youtubeUrl, participantId }`
- Green "+ Add" button activates only when a track is selected (search) or URL is non-empty (url)
- Error displayed inline below

## SongSearch (frontend/src/components/SongSearch.jsx)
- Typeahead backed by LastFM via backend proxy (`GET /search/tracks?q=...`)
- 300ms debounce + 2-char minimum before any network request fires
- Dropdown renders **above** the input (queue sits near bottom of viewport)
- Each row: album art thumbnail (28px) + track name + artist
- Clicking a result fills the input as "Name — Artist" and calls `onSelect(track)`
- X button clears selection and resets search
- No YouTube calls happen during search — only on submission

## SongCache (backend DB + songs.ts)
- Global cross-party cache: `SongCache` model keyed by `canonicalId` = SHA-256(`artist.lower()|title.lower()`).slice(0,24)
- Stores: `videoId`, `youtubeUrl`, `title`, `artist`, `thumbnailUrl`, `durationSec`
- `resolveTrack(artist, title)` in songs.ts:
  - Cache hit → returns stored data, **0 YouTube API calls**
  - Cache miss → `search.list` (find videoId) + `videos.list` (metadata) → stores in `SongCache` permanently
- Same song added by any user across any party reuses the cache entry

## Search backend route (backend/src/routes/search.ts)
- `GET /search/tracks?q=...` — proxies LastFM `track.search`, returns `[{ name, artist, mbid, image }]`
- API key kept server-side; limit=8 results
- Mounted at `/search` in index.ts

## Songs backend POST (updated)
- Accepts `{ youtubeUrl, participantId }` (URL mode) **or** `{ title, artist, participantId }` (search mode)
- Search mode path: calls `resolveTrack` → checks `SongCache` → YouTube API only on cache miss
- URL mode path: extracts videoId, calls `fetchYouTubeMeta` directly (no cache; already a known video)

## PartyContext (frontend/src/context/PartyContext.jsx)
- `<PartyProvider data={hostData}>` wraps StagePage in App.tsx once onComplete fires
- `useParty()` returns `{ partyId, participantId, isHost, joinCode, groupName, hostName, autoAccept, maxSongLengthSec }`
- All stage components (MixingTable, Player, History, Queue, AddSong) read session identity from context — no prop drilling
- `isHost` drives layout decisions throughout (History tab position, MixingTable vs Player, etc.)

## Songs backend (backend/src/routes/songs.ts)
- GET /parties/:partyId/songs — queued+pending+playing ordered by position
- POST /parties/:partyId/songs — extract video ID, fetch YouTube Data API v3 metadata (title, artist, thumbnail, duration), create Song, broadcastQueue
  - Graceful fallback if YOUTUBE_API_KEY not set (uses "YouTube: {videoId}" as title)
  - Enforces maxSongs limit, validates participant membership
- DELETE /parties/:partyId/songs/:songId — host-only ban (sets status="banned")
- broadcastQueue in broadcast.ts called after add/ban → io.to(partyId).emit("queue-updated", songs)
- POST /parties/:partyId/songs/advance (host-only):
  - updateMany flips all playing → played
  - findFirst on queued ordered by position → update to playing, sets startedAt=now
  - Calls initPlayback + broadcastPlayback + broadcastQueue
- See "Songs backend additions" section for approve/reject/pause/resume

## broadcast.ts (backend/src/broadcast.ts)
- initBroadcast(io) called once at startup
- broadcastQueue(partyId) + broadcastParticipants(partyId) — shared helpers used by routes + socket handlers
- broadcastHistory(partyId) — fetches played songs with ratings[], emits "history-updated" to room
- Avoids circular imports between index.ts ↔ routes

## .env (root)
- PORT=3000
- YOUTUBE_API_KEY= (got from Google Cloud Console → YouTube Data API v3)

## Frontend flows
- HostForm POSTs to backend → onSubmit receives full party + participantId
- JoinForm fetches GET /parties list, POST /parties/:joinCode/join on selection
- onComplete fires → App wraps StagePage in <PartyProvider data={hostData}> → all components access session via useParty()
- host hits ▶ next → backend atomically transitions songs → broadcastQueue + broadcastHistory fire → queue-updated + history-updated socket events update state → Player's currentSong changes → new iframe loads with autoplay=1
- song moves to played → History panel tab shows updated count → click tab to open → click played song to rate → POST /:songId/rate → broadcastHistory → all clients see updated avg stars

## DiaglogSequence (frontend/src/pages/DialogSequence.jsx)
- Adds isHost: true to the data passed to onComplete on the host path. 
- Join flow data never sets it, so it stays falsy.

## Player — (frontend/src/components/Player.jsx)

- Uses YouTube IFrame API (YT.Player JS SDK, not raw iframe src) — loaded once via script tag injection
- Props: song, isPaused, effectiveStartTime (partyId, participantId, isHost from useParty())
- On song change: recreates YT.Player with start=elapsedSec (late-join seek)
- On isPaused change: calls player.pauseVideo() or player.seekTo(elapsed)+playVideo()
- Info bar badge switches between "NOW PLAYING" (purple) and "PAUSED" (amber)
- loadYTScript() / whenYTReady() handle idempotent script loading + onYouTubeIframeAPIReady chaining

## MixingTable — (frontend/src/components/MixingTable.jsx)

- Host-only control center, renders in StagePage when isHost=true
- Props: songs, participants, isPaused, effectiveStartTime (session identity from useParty())
- Wraps Player (center), with VinylSpinner (left=now playing, right=up next)
- VinylSpinner: SVG vinyl with groove rings + CSS @keyframes vinyl-spin (4s), stops when no song
- DrumPad: 64×64 skeuomorphic pad with LED dot; isToggle pads show green/red border; flash=true glows green when action available
- RotaryDial: 56px knob, click=next / right-click=prev, pointer rotates -130°→+130°
- Pad grid (2 rows × 4):
  - Row 1: AUTO-ACCEPT (toggle) | APPROVE SONG | REJECT SONG | ▶ NEXT
  - Row 2: BAN SONG | KICK USER | ⏸ PAUSE / ▶ PLAY (toggle) | (filler)
- PARTICIPANT dial: cycles non-host participants; KICK applies to selected
- MAX LENGTH dial: OFF / 1:00 / 2:00 / 3:00 / 5:00 / 10:00 — PATCHes party on change
- Pending song info panel shows oldest pending song (APPROVE/REJECT operate on it FIFO)

## Playback sync — broadcast.ts

- partyPlayback: Map<partyId, { effectiveStartTime, isPaused, pausedAt? }> — in-memory per party
- effectiveStartTime: "virtual" start time that shifts forward by pause duration on each resume
- Client computes elapsedSec = (Date.now() - effectiveStartTime) / 1000 for seek
- initPlayback(partyId, startedAt) — called by /advance
- pausePlayback / resumePlayback — called by /pause and /resume routes
- broadcastPlayback(partyId) — emits playback-updated to room
- emitPlaybackToSocket(socketId, partyId) — targeted emit for late-join sync
- Server restart recovery: join-party handler checks in-memory map; if missing, fetches song.startedAt from DB and calls initPlayback

## Songs backend additions (backend/src/routes/songs.ts)

- POST /advance: now sets song.startedAt = now, calls initPlayback + broadcastPlayback + broadcastHistory
- POST /:songId/approve — host approves pending song (pending → queued), broadcastQueue
- POST /:songId/reject — host rejects pending song (pending → banned), broadcastQueue
- POST /pause — host pauses; calls pausePlayback, broadcastPlayback
- POST /resume — host resumes; calls resumePlayback (shifts effectiveStartTime), broadcastPlayback
- GET /history — returns songs with status="played", ordered by startedAt asc, includes ratings[] + addedBy
- POST /:songId/rate — submit/update rating; body: { participantId, stars (0.5–5.0 float) }; converts to int (×2); anti-abuse: blocks own-song rating; upserts Rating; calls broadcastHistory

## Parties backend additions (backend/src/routes/parties.ts)

- PATCH /:partyId — host updates autoAccept and/or maxSongLengthSec
- DELETE /:partyId/participants/:pid — host kicks participant (isBanned=true), broadcastParticipants

## StagePage (frontend/src/pages/StagePage.jsx)

- Reads partyId + participantId from useParty() — no hostData prop
- Connects socket on mount, emits join-party with partyId + participantId
- Listens for participants-updated + queue-updated + playback-updated + history-updated → state
- Fetches initial queue + history on mount
- playback state: { isPaused, effectiveStartTime } — passed to MixingTable (host) and Player (guest)
- Host: renders MixingTable at min(86vw, 760px), centered
- Guest: renders Player + participant sidebar (top-right) showing groupName + joinCode from context
- Both: renders <History songs={history} /> (portal, self-positions via useParty().isHost)
