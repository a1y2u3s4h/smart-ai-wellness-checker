import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { GoogleGenAI, Type } from "@google/genai";
import {
  SYSTEM_INSTRUCTION, DISCLAIMER, validateInput, detectRedFlags, enrichContext, buildPrompt,
  parseModelOutput, applySafety, safeFallback, emergencyFallback,
} from "./pipeline.js";

const PORT = process.env.PORT || 5000;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const TIMEOUT_MS = 25000;
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
    warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendation: { type: Type.STRING },
    riskLevel: { type: Type.STRING, enum: ["Low", "Moderate", "High"] },
  },
  required: ["summary", "benefits", "warnings", "recommendation", "riskLevel"],
};

async function callGemini(prompt) {
  let timer;
  const timeout = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error("timeout")), TIMEOUT_MS); });
  try {
    const res = await Promise.race([
      ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema, temperature: 0.3 },
      }),
      timeout,
    ]);
    return res.text;
  } finally {
    clearTimeout(timer);
  }
}

const app = express();
app.use(cors({ origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","), methods: ["GET", "POST"] }));
app.use(express.json({ limit: "10kb" }));
app.use("/api/", rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: "Too many requests. Please wait a minute and try again." } }));

app.get("/", (_req, res) => res.json({ status: "ok", message: "Smart AI Wellness Checker API" }));

app.post("/api/analyze", async (req, res) => {
  // 1. Validation
  const v = validateInput(req.body);
  if (v.error) return res.status(400).json({ error: v.error });

  // 2. Deterministic safety detection + 3. context enrichment
  const flags = detectRedFlags(v.input);
  const prompt = buildPrompt(v.input, enrichContext(v.input), flags);

  if (!ai) {
    if (flags.length) return res.json({ ...emergencyFallback(flags), disclaimer: DISCLAIMER });
    return res.status(500).json({ error: "The AI service is not configured on the server." });
  }

  try {
    // 4. Gemini structured generation -> 5. JSON validation -> 6. risk normalization + safety merge
    const raw = await callGemini(prompt);
    const parsed = parseModelOutput(raw);
    const result = parsed ? applySafety(parsed, flags) : flags.length ? emergencyFallback(flags) : safeFallback();
    return res.json({ ...result, disclaimer: DISCLAIMER });
  } catch (err) {
    // Log only a truncated message, never the key or user input
    const msg = String(err?.message || "unknown").split(process.env.GEMINI_API_KEY).join("[redacted]").slice(0, 200);
    console.error("Gemini request failed:", msg);
    if (flags.length) return res.json({ ...emergencyFallback(flags), disclaimer: DISCLAIMER });
    const timedOut = err?.message === "timeout";
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut ? "The AI service took too long to respond. Please try again." : "The AI service is temporarily unavailable. Please try again shortly.",
    });
  }
});

app.use((_req, res) => res.status(404).json({ error: "Not found." }));
app.use((err, _req, res, _next) => {
  if (err.type === "entity.parse.failed" || err.type === "entity.too.large")
    return res.status(400).json({ error: "Invalid request body." });
  res.status(500).json({ error: "Something went wrong." });
});

if (!ai) console.warn("WARNING: GEMINI_API_KEY is not set. Copy .env.example to .env and add your key.");
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
