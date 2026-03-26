import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { computerUseRouter } from "./routes/computerUse.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowed = new Set([
  "https://investors.mayiguide.com",
  "http://localhost:5173",
  "http://localhost:4173",
  ...(process.env.ADDITIONAL_ORIGINS?.split(",").map((s) => s.trim()) ?? []),
]);

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (!origin || allowed.has(origin)) {
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: "20mb" })); // screenshots can be large

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.use("/api/computer-use", computerUseRouter);

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] listening on port ${PORT}`);
});
