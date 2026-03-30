import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { computerUseRouter } from "./routes/computerUse.js";
import { pdfExportRouter } from "./routes/pdfExport.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// ── CORS ─────────────────────────────────────────────────────────────────────
// Wildcard CORS — this server only receives screenshots and returns structured
// action arrays; no user credentials or sensitive data cross this boundary.
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: "20mb" })); // screenshots can be large

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.use("/api/computer-use", computerUseRouter);
app.use("/api/export", pdfExportRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[server] request failed", error);
  res.status(500).json({
    error: "request_failed",
    message: error instanceof Error ? error.message : "Unknown server error",
  });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] listening on port ${PORT}`);
});
