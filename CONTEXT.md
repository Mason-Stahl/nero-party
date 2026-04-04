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
- **Search:** LastFM/Deezer Thing i was builidng before for autofill song search. *or* just possible to use youtube search.

# Tech Structure 

## src/components 
### Main components (TO BUILD)
**notes** - either eigth or beamed eigth notes. (semiquaver when subtext is necessary) <br> The title of the track or usersname goes in that line that defines eigth note. Or in that line that connects the beamed notes.
**scoreboard** - 2 options 
- Bar chart, (easy to understand- on small screen size)
1. Name [xxxxxx    ] #Points
2. Name [xxxx      ] #Points
- Music Bar chart (more fun/unique, harder to build)
#---[1.name]------------#
#--d-------d---[2.name]-#
#-------------d-------d-#
#-----------------------#
**queue** - barchart, leftmost note is next to be played. Display 5 at a time, with button to show more. 
*AddSong* - sits inside queue. Textbox to insert URL of youtube video. or *SearchBar* -  pulls from LastFM+MusicBrainz+Discogs for autofill -> converts to youtube link. (to youtube playback will be challange!) (searchbar may be scrapped)
**history** - where the played songs list and info is: title, artist, duration. Design is more simple. Handwritten-looking history (guitar hero 3 style lined-paper) click on song to open rating box. 
*rating* - sits inside of history, holds stars and submit button, handles db stuff. *stars* sits inside of rating (1-5 * w/ .5 = rating out of 10). 
**groupchat** - for fun, send messages with the party. (more components necessary?)
**Player** - (MAY CHANGE TO ALBUM ART or Thumbnail image) get video feed and display it on a 'tv' in the club. 
**MixingTable** - Left spinner now playing, right spinner up next (ability to preview up next w/ button). Internal squares manage <br>-auto accept, max song length, Y/N song approval, ban song (prevent spam), group managemenet, - kick from group
**Hamburger** - Export Playlist, Leave Group


### Helper/Formatting/Intro Components (COMPLETE)
**DialogBubble** - Format intro speech bubble - Visual shell — arrow, border-radius, text, subtext, children slot
**DialogSequence** - State manage ordering of speech bubbles
**GlowButton** - Cool looking button - copied from website
**Writband** - Cool looking button - squmorphic for entry.
**HostForm** - Dialog bubble element - Builds Joinable Lobby  
**NeroIntro** - Animation intro sequence management. Renders <DialogSequence /> after pan completes
**JoinForm** - Dialog bubble elemtn - Lobby search list

### TBD Components
Lobby Finding - Copy what I did for TTD - just with local storage. 

- steal star ranting from root
- steal youtube playback from moojik
- steal ranking from moojik
- steal lobby from TTD

## frontend/public/images
- background.png
- car1, car2, car3.png
- stage.png

### NeroIntro animation plays
  → DialogSequence fades in
    → choice: Host / Join
    → host-form: name + group + privacy
    → host-confirm: bouncer line shows for 2.5s
      → onComplete(data) fires
        → App: setFadeOut(true) — 2s fade to black
        → App: after 2s, swap to StagePage
        → App: overlay fades back in (0.4s)
          → StagePage with stage.png

## dev.db
Party — joinCode (shareable), host config (maxSongs, timeLimitMin, autoAccept, maxSongLengthSec), status lifecycle
Participant — ephemeral, no auth, socketId for reconnect, isBanned for kick
Song — status: pending→queued→playing→played/skipped/banned, position for ordering; addedByParticipantId FK enables rating exclusion rule
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

## StagePage (frontend/src/pages/StagePage.jsx)
- Connects socket on mount, emits join-party with hostData.id + hostData.participantId
- Listens for participants-updated + queue-updated → state
- Fetches initial queue via GET on mount
- Participant panel: top-right, shows groupName, joinCode, live status, participant list (temp — will move to MixingTable)
- Queue panel: bottom bar, pinned

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
- YouTube URL input → POST /parties/:partyId/songs
- Enter key submits; green button when valid; error display inline

## Songs backend (backend/src/routes/songs.ts)
- GET /parties/:partyId/songs — queued+pending+playing ordered by position
- POST /parties/:partyId/songs — extract video ID, fetch YouTube Data API v3 metadata (title, artist, thumbnail, duration), create Song, broadcastQueue
  - Graceful fallback if YOUTUBE_API_KEY not set (uses "YouTube: {videoId}" as title)
  - Enforces maxSongs limit, validates participant membership
- DELETE /parties/:partyId/songs/:songId — host-only ban (sets status="banned")
- broadcastQueue in broadcast.ts called after add/ban → io.to(partyId).emit("queue-updated", songs)

## broadcast.ts (backend/src/broadcast.ts)
- initBroadcast(io) called once at startup
- broadcastQueue(partyId) + broadcastParticipants(partyId) — shared helpers used by routes + socket handlers
- Avoids circular imports between index.ts ↔ routes

## .env (root)
- PORT=3000
- YOUTUBE_API_KEY= (get from Google Cloud Console → YouTube Data API v3)

## Frontend flows
- HostForm POSTs to backend → onSubmit receives full party + participantId
- JoinForm fetches GET /parties list, POST /parties/:joinCode/join on selection
- hostData passed from App → StagePage contains: id, joinCode, groupName, hostName, participantId