import { Router } from "express";
import { env } from "../env.js";

const router = Router();

// GET /search/tracks?q=... — proxy LastFM track.search, returns top results
router.get("/tracks", async (req, res) => {
  const q = (req.query.q as string)?.trim();
  if (!q) return res.json([]);

  if (!env.LASTFM_API_KEY) {
    return res.status(503).json({ error: "LastFM API key not configured" });
  }

  const url =
    `http://ws.audioscrobbler.com/2.0/?method=track.search` +
    `&track=${encodeURIComponent(q)}` +
    `&api_key=${env.LASTFM_API_KEY}` +
    `&format=json&limit=8`;

  const resp = await fetch(url);
  const data = await resp.json() as any;

  const raw = data?.results?.trackmatches?.track ?? [];
  const tracks = Array.isArray(raw) ? raw : [raw];

  return res.json(
    tracks.map((t: any) => ({
      name:   t.name,
      artist: t.artist,
      mbid:   t.mbid || null,
      image:  t.image?.find((i: any) => i.size === "small")?.["#text"] || null,
    }))
  );
});

export default router;
