## Project Goal

Build a **high‑quality universal music search system** that supports **typeahead/autofill and selection** for **songs**.

Its sole purpose is to let users reliably **find and select the correct musical entity** with minimal friction, across mainstream and long‑tail catalogs.

Success criteria:

* Fast, typo‑tolerant typeahead search
* High hit‑rate for mainstream queries
* Reasonable coverage of obscure / indie / physical‑only releases
* Clean de‑duplicated results
* Stable internal identifiers for selected entities

---

## High‑Level Architecture

**Frontend**: React

* Debounced typeahead input
* Displays unified results (Song / Album / Artist)

**Backend**: FastAPI - Express.js, Prisma, Socket.IO

* Aggregates and normalizes results from multiple metadata APIs
* Handles merging, ranking, and canonicalization

**Database**: SQLite

* Caches resolved entities
* Stores canonical identifiers and aliases

---

## Core Design Principle

> **No single music database is sufficient.**

Instead of choosing one “primary” API, the system:

1. **Searches multiple sources in parallel**
2. **Merges overlapping results**
3. **Ranks by likelihood of user intent**
4. **Canonicalizes entities once selected**

This keeps UX strong while maintaining clean internal data.

---

## API Roles & Responsibilities

### 1. Last.fm API — *Search & Intent Detection*

**Role**: Primary *search UX* layer

Why:

* Strong fuzzy matching
* Good typo tolerance
* Biased toward what users commonly search

Used for:

* Initial typeahead candidates
* Popularity signal (listener counts, match confidence)

Not used for:

* Canonical IDs
* Long‑term storage

---

### 2. MusicBrainz API — *Canonical Identity & Metadata Graph*

**Role**: Source of truth for entity identity

Why:

* Stable, globally unique IDs (MBIDs)
* Clear separation of artist / release / recording
* Strong relational model

Used for:

* De‑duplication
* Assigning canonical IDs
* Normalizing metadata after a match

Not used for:

* Primary search UX
* Ranking by popularity

---

### 3. Discogs API — *Long‑Tail Coverage*

**Role**: Coverage expansion

Why:

* Excellent for indie, obscure, physical‑only, and archival releases

Used for:

* Filling gaps when other sources miss
* Increasing overall catalog breadth

Not used for:

* Typeahead UX
* Precise ranking

---

## Search Flow (Step‑by‑Step)

### Step 1: User Input

* User types into search bar
* Frontend debounces input (≈200ms)

---

### Step 2: Parallel Search (Backend)

FastAPI endpoint fires **concurrent requests** to:

* Last.fm (track / album / artist search)
* MusicBrainz (artist + recording search)
* Discogs (artist + release search)

All calls:

* Have short timeouts (300–500ms)
* Are non‑blocking

---

### Step 3: Normalization

All results are normalized:

* Lowercased text
* Stripped punctuation
* Normalized whitespace
* Unified handling of "feat." / "ft." / "featuring"

---

### Step 4: Entity Matching (De‑duplication)

Results are grouped using **cheap heuristics**:

* **Track key**: `normalized_title + normalized_primary_artist`

If multiple sources map to the same key → treat as one entity.

---

### Step 5: Canonicalization

If *any* grouped result includes a MusicBrainz MBID:

* Promote MBID as canonical ID
* Attach other source results as aliases

If no MBID exists:

* Generate internal UUID
* Allow later back‑fill if MBID is discovered

---

### Step 6: Ranking

Each unified result receives a score:

```
score =
  source_weight
+ popularity_bonus
+ text_match_quality
```

Example weights:

* Last.fm hit: +30
* MusicBrainz hit: +20
* Discogs hit: +10

Bonuses:

* Exact title match
* Exact artist match
* Last.fm popularity signals

Results are returned sorted by score.

---

### Step 7: Response to Frontend

Each result includes:

* Entity type (song / album / artist)
* Display name
* Primary artist
* Canonical ID
* Source confidence

---

## Selection Flow

When a user selects a result:

1. Canonical entity is persisted to Postgres
2. Aliases from all sources are stored
3. MBID (if present) becomes permanent reference
4. Future searches reuse cached entity

---

## Database Responsibilities (Postgres)

Tables should support:

* Canonical entities
* Alternate names / aliases
* Source mappings (Last.fm ID, Discogs ID, MBID)
* Lightweight popularity hints

Purpose:

* Faster repeat searches
* Stable identifiers
* Reduced API dependency

---

## Strategic Notes

* **MusicBrainz is not a fallback** — it is an identity layer
* **Last.fm drives UX**, not data purity
* **Discogs improves recall**, not precision
* Parallel search + ranking is simpler than sequential logic
* Paid APIs are unnecessary unless hit‑rate complaints emerge

---

## Explicit Non‑Goals

* No audio playback
* No streaming links
* No rights management
* No charts or analytics

---

## Engineering Task Breakdown

This section converts the specification into **explicit implementation tasks** suitable for assignment to a full‑stack engineer.

---

## Phase 0 — Setup & Foundations

### Backend

* Initialize FastAPI project
* Configure async HTTP client (httpx or aiohttp)
* Set global request timeouts (300–500ms per external API)
* Implement basic rate‑limit protection per client IP

### Frontend

* Initialize React app
* Create debounced search input component
* Implement dropdown result list with keyboard navigation

### Database

* Initialize PostgreSQL
* Set up migrations (Alembic or equivalent)

---

## Phase 1 — External API Integration

### Task 1.1: Last.fm Integration

Responsibilities:

* Track.search
* Album.search
* Artist.search

Implementation:

* Wrap in async client
* Normalize returned fields to internal format
* Extract popularity signals when available

Deliverable:

* `search_lastfm(query) -> List[RawResult]`

---

### Task 1.2: MusicBrainz Integration

Responsibilities:

* Artist search
* Recording search

Implementation:

* Respect rate limits (mandatory)
* Capture MBID for all entities
* Normalize names and relationships

Deliverable:

* `search_musicbrainz(query) -> List[RawResult]`

---

### Task 1.3: Discogs Integration

Responsibilities:

* Artist search
* Release search

Implementation:

* Focus on name + artist fields
* Treat results as low‑confidence inputs

Deliverable:

* `search_discogs(query) -> List[RawResult]`

---

## Phase 2 — Normalization & Matching Layer

### Task 2.1: Text Normalization Utilities

Implement shared helpers:

* Lowercasing
* Punctuation stripping
* Whitespace normalization
* Feature normalization (feat / ft / featuring)

Deliverable:

* `normalize_text(str) -> str`

---

### Task 2.2: Entity Key Generation

Implement deterministic keys:

* Track key: `title + primary_artist`

Deliverable:

* `generate_entity_key(result) -> str`

---

### Task 2.3: Result Grouping

Responsibilities:

* Group RawResults by entity key
* Preserve source provenance

Deliverable:

* `group_results(results) -> Dict[key, GroupedEntity]`

---

## Phase 3 — Canonicalization

### Task 3.1: MBID Promotion Logic

Rules:

* If any grouped result has MBID → use as canonical ID
* Else generate internal UUID

Deliverable:

* `canonicalize(grouped_entity) -> CanonicalEntity`

---

### Task 3.2: Alias Attachment

Responsibilities:

* Attach alternate titles
* Attach source‑specific IDs

Deliverable:

* Canonical entity with alias list

---

## Phase 4 — Ranking Engine

### Task 4.1: Scoring Function

Implement weighted scoring:

```
score = source_weight + popularity_bonus + match_quality
```

Weights:

* Last.fm: +30
* MusicBrainz: +20
* Discogs: +10

Deliverable:

* `rank_entities(entities) -> sorted list`

---

### Task 4.2: Result Truncation

Responsibilities:

* Limit results per entity type
* Prefer diversity (artist / album / track mix)

Deliverable:

* Ranked response list

---

## Phase 5 — API Layer

### Task 5.1: Search Endpoint

Endpoint:

* `GET /search?q=`

Responsibilities:

* Parallel API calls
* Merge, canonicalize, rank
* Return unified schema

Deliverable:

* JSON response optimized for typeahead

---

### Task 5.2: Selection Endpoint

Endpoint:

* `POST /select`

Responsibilities:

* Persist canonical entity
* Store aliases and source mappings

---

## Phase 6 — Database Schema

### Required Tables

* `entities`

  * id (UUID)
  * type (artist/album/track)
  * canonical_name
  * mbid (nullable)

* `aliases`

  * entity_id
  * source
  * source_id
  * display_name

* `search_cache`

  * query
  * entity_id
  * score

---

## Phase 7 — Caching & Performance

### Task 7.1: In‑Memory Cache

* Cache recent queries (LRU)
* Short TTL (seconds)

### Task 7.2: Persistent Cache

* Cache canonicalized entities
* Reduce repeat API calls

---

## Phase 8 — Frontend Integration

### Task 8.1: Typeahead UX

* Display ranked results
* Show entity type badge
* Highlight matched text

### Task 8.2: Selection Handling

* Persist selection via backend
* Reuse canonical ID

---

## Phase 9 — Testing & Validation

* Unit tests for normalization and matching
* Integration tests for API aggregation
* Manual testing with mainstream + obscure queries

---

## Phase 10 — Post‑Launch Enhancements (Optional)

* Query logging for missed searches
* Backfill MusicBrainz IDs
* Add additional metadata providers

---

## Outcome

This task breakdown enables:

* Parallel development
* Clear ownership boundaries
* Incremental rollout
* Future extensibility without refactor
