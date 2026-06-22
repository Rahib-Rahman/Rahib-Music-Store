"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const songs_1 = __importDefault(require("./routes/songs"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 4000;
// ── Middleware ────────────────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN ?? "*",
    methods: ["GET"],
}));
app.use(express_1.default.json());
// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", songs_1.default);
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
exports.default = app;
