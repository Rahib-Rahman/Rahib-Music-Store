"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const songData_1 = require("../generators/songData");
const coverGenerator_1 = require("../generators/coverGenerator");
const musicGenerator_1 = require("../generators/musicGenerator");
const router = (0, express_1.Router)();
// GET /api/songs
router.get("/songs", async (req, res) => {
    try {
        const locale = req.query.locale ?? "en-US";
        const seed = req.query.seed ?? "42";
        const avgLikes = parseFloat(req.query.avgLikes ?? "3");
        const page = parseInt(req.query.page ?? "0", 10);
        const pageSize = Math.min(parseInt(req.query.pageSize ?? "10", 10), 50);
        const validLocales = ["en-US", "de-DE", "uk-UA"];
        if (!validLocales.includes(locale)) {
            return res.status(400).json({ error: "Invalid locale" });
        }
        if (isNaN(page) || page < 0) {
            return res.status(400).json({ error: "Invalid page" });
        }
        if (isNaN(avgLikes) || avgLikes < 0 || avgLikes > 10) {
            return res.status(400).json({ error: "avgLikes must be 0–10" });
        }
        const songs = (0, songData_1.generatePage)(locale, seed, page, pageSize, avgLikes);
        return res.json({ songs, page, pageSize, locale });
    }
    catch (err) {
        console.error("Error generating songs:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// GET /api/cover
router.get("/cover", async (req, res) => {
    try {
        const seed = req.query.seed ?? "default";
        const title = req.query.title ?? "Unknown";
        const artist = req.query.artist ?? "Unknown";
        const buffer = (0, coverGenerator_1.generateCoverBuffer)({ title, artist, seed });
        res.set({
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400, immutable",
            "Content-Length": buffer.length.toString(),
        });
        return res.send(buffer);
    }
    catch (err) {
        console.error("Error generating cover:", err);
        return res.status(500).json({ error: "Cover generation failed" });
    }
});
// GET /api/music
router.get("/music", async (req, res) => {
    try {
        const seed = req.query.seed ?? "default";
        const buffer = await (0, musicGenerator_1.generateMidiBuffer)(seed);
        res.set({
            "Content-Type": "audio/midi",
            "Cache-Control": "public, max-age=86400, immutable",
            "Content-Length": buffer.length.toString(),
        });
        return res.send(buffer);
    }
    catch (err) {
        console.error("Error generating music:", err);
        return res.status(500).json({ error: "Music generation failed" });
    }
});
exports.default = router;
