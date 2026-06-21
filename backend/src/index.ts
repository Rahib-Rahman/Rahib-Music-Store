import express from "express";
import cors from "cors";
import songsRouter from "./routes/songs";

const app = express();
const PORT = process.env.PORT ?? 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? "*",
  methods: ["GET"],
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", songsRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Music Store API running on http://localhost:${PORT}`);
});

export default app;

