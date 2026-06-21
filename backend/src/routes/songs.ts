import { Router, Request, Response } from "express";
import { generatePage } from "../generators/songData";
import { generateCoverBuffer } from "../generators/coverGenerator";
import { generateMidiBuffer } from "../generators/musicGenerator";
import type { Locale } from "../types";

const router = Router();

// GET /api/songs
router.get("/songs", async (req: Request, res: Response) => {
  try {
    const locale = (req.query.locale as Locale) ?? "en-US";
    const seed = (req.query.seed as string) ?? "42";
    const avgLikes = parseFloat((req.query.avgLikes as string) ?? "3");
    const page = parseInt((req.query.page as string) ?? "0", 10);
    const pageSize = Math.min(parseInt((req.query.pageSize as string) ?? "10", 10), 50);

    const validLocales: Locale[] = ["en-US", "de-DE", "uk-UA"];
    if (!validLocales.includes(locale)) {
      return res.status(400).json({ error: "Invalid locale" });
    }
    if (isNaN(page) || page < 0) {
      return res.status(400).json({ error: "Invalid page" });
    }
    if (isNaN(avgLikes) || avgLikes < 0 || avgLikes > 10) {
      return res.status(400).json({ error: "avgLikes must be 0–10" });
    }

    const songs = generatePage(locale, seed, page, pageSize, avgLikes);

    return res.json({ songs, page, pageSize, locale });
  } catch (err) {
    console.error("Error generating songs:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/cover
router.get("/cover", async (req: Request, res: Response) => {
  try {
    const seed = (req.query.seed as string) ?? "default";
    const title = (req.query.title as string) ?? "Unknown";
    const artist = (req.query.artist as string) ?? "Unknown";

    const buffer = generateCoverBuffer({ title, artist, seed });

    res.set({
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Length": buffer.length.toString(),
    });

    return res.send(buffer);
  } catch (err) {
    console.error("Error generating cover:", err);
    return res.status(500).json({ error: "Cover generation failed" });
  }
});

// GET /api/music
router.get("/music", async (req: Request, res: Response) => {
  try {
    const seed = (req.query.seed as string) ?? "default";

    const buffer = await generateMidiBuffer(seed);

    res.set({
      "Content-Type": "audio/midi",
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Length": buffer.length.toString(),
    });

    return res.send(buffer);
  } catch (err) {
    console.error("Error generating music:", err);
    return res.status(500).json({ error: "Music generation failed" });
  }
});

export default router;
