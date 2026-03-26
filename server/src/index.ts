import "dotenv/config";
import express from "express";
import cors from "cors";
import { computerUseRouter } from "./routes/computerUse.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowed = new Set([
  "https://investors.mayiguide.com",
  "http://localhost:5173",
  "http://localhost:4173",
  // Allow any Railway preview URL during development
  ...(process.env.ADDITIONAL_ORIGINS?.split(",").map((s) => s.trim()) ?? []),
]);

const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. curl, Postman) and allowed origins
    if (!origin || allowed.has(origin)) return cb(null, true);
    cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

// Respond to all CORS preflight (OPTIONS) requests before any route handler
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json({ limit: "20mb" })); // screenshots can be large

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.use("/api/computer-use", computerUseRouter);

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] listening on port ${PORT}`);
});
