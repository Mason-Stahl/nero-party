# Feature Prioritization

1. scoreboard 
2. rating system
3. host preview 
4. host Y/N 

# Design 

- It's a party.
- Music-focused-skeuomorphism (dials, bars of notes)

## Opening

2s animation
car pulls up, people in line, stops, door opens, 3 door frames, look back see line go back into distance, look up see nero led red sign, look back down, on figure with guitar on back, female figure with drumsticks in hand on hand, bouncer in front of you. (entering screen appears)

# Flow

### Entering Party
1. Host or join
- If host -> 
[set name] [🔓(toggle)🔒] 'public/private' [set password]
- If Join
Public lobby list 
Private: [enter password]


# Design Structure

1. Host (DJ - Streamer)
- Set Group Information
- Mixing Table for managing queue and group (see component below for info)
- 
2. Users [need name]
- Add to queue
- Vote on whats played

## Design Decisions

Can DJ's Vote? Yes, encourage engagment
Show who queued what song? No, anonymous to other users, encourage unbias
Live Scoreboard? Yes, encourage competitive engagment

# Tech Structure 

## src/components
### Main components
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


### Helper/Formatting/Intro Components
**DialogBubble** - Format intro speech bubble - Visual shell — arrow, border-radius, text, subtext, children slot
**DialogSequence** - State manage ordering of speech bubbles
**GlowButton** - Cool looking button - copied from website
**Writband** - Cool looking button - squmorphic for entry.
**HostForm** - Dialog bubble element - Builds Joinable Lobby  
**NeroIntro** - Animation intro sequence management. Renders <DialogSequence /> after pan completes

### TBD Components
Lobby Finding - Copy what I did for TTD - just with local storage. 

- steal star ranting from root
- steal youtube playback from moojik
- steal ranking from moojik
- steal lobby from TTD

## frontend/public/images
- background.png
- car1, car2, car3.png
- stage

### Thoughts:

How do i prevent someone from giving everyone else 1 star so they win? can i have some kind of algorithm that aggregate score for each user?

Also i would like to export the play history as a playlist, creating a youtube playlist may be possible, do i want that on my account tho? maybe just an excel or smthng that has the name and urls ?

*redesign* still building for group of friends who want to listen together remotely, or for people who want to discover new songs/meet random people 

## TO DO
3. Design Changes

### Designs to keep: 
- Groupchat Phone
- Scoreboard
- Youtube video embed

### Design Modifications
- circular controls for guests (request to pause / request to skip) (or use groupchat for this? yep)
- should voting be seperate from history? (could encourage make it obvious, however you vote on historic songs? yep)
- notes removal to album covers (maybe spinning disk which currently exists in mixing table above or below it)
- black background, white text, green accent, slight slight glassiness 
- Join flow (lobby screen + host button)
- instead of random 6 letters for link, make it groupname + incrementing numbers if lobby already exists
-

### Layout

**desktop**

- 20% - group info *for host (settings - new page)*
- 50% - horizontal scrollwheel queue 
        (<)(>)(jump to present)
[[previous][now playing][up next]]
*for host - under now playing - (pause/play, skip, ban song)*
- 30% - (vote) ('add to queue' searchbox) (groupchat)

**mobile layout**

top - group info
middle - horizontal scrollwheel queue,
    searchbox
navbar - [vote, home, groupchat]

### notes

-mobile reponsive move middle NERO PARTY TO left of navbar 
-green lets go for host - prob remove
-mobile responsive settings page collapsable left side into hamburger menu


-if join from link LobbyPage with just name entry. 

