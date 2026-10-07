# Smart AI Ingredient & Wellness Checker

## Overview
A full-stack web app where users enter ingredients, supplements, beverages, packaged-food ingredients, or general wellness concerns and receive a structured AI analysis: summary, potential benefits, things to consider, a risk level, and a practical recommendation.

It provides **general wellness information only**. It does not diagnose diseases or prescribe medication.

## Features
- Structured analysis cards with Low / Moderate / High risk (icon + text label, not color alone)
- Server-side Gemini integration with schema-constrained JSON output
- Deterministic red-flag detection that runs independently of the AI
- Small local ingredient knowledge layer used as supporting prompt context
- Backend validation, rate limiting, CORS config, safe error messages
- Responsive UI (mobile / tablet / desktop), loading and error states, example chips, character counter

## Architecture
```
React (Vite)
   ↓  POST /api/analyze
Express REST API
   ↓
Safety / Validation Layer   (validation + red-flag detection + context enrichment)
   ↓
Gemini (server-side key)    (structured generation)
   ↓
Structured JSON             (parse → validate → normalize risk → merge safety)
   ↓
React (result cards)
```

## Tech Stack
React 18, Vite, Tailwind CSS 3, Lucide React · Node.js, Express · `@google/genai` (official Google GenAI SDK)

## AI Architecture
```
User input → Validation → Red-flag detection → Context enrichment
          → Gemini structured generation → JSON validation → Risk normalization → Response
```
| Stage | File | What it does |
|---|---|---|
| Validation | `pipeline.js#validateInput` | Type, non-empty, max 2000 chars (never trusts the frontend) |
| Safety detection | `pipeline.js#detectRedFlags` | Regex phrase matching for emergency language (breathing difficulty, chest pain, overdose, self-harm...). Not diagnostic. |
| Context enrichment | `pipeline.js#ingredientRules` | Small hand-written rules for common ingredients, injected as *supporting context only* |
| Prompt engineering | `pipeline.js#SYSTEM_INSTRUCTION` | Non-diagnostic role, red-flag handling, "user text is data" guard |
| Structured generation | `server.js#callGemini` | `responseMimeType: application/json` + `responseSchema` with enum risk level, 25 s timeout |
| Normalization | `pipeline.js#parseModelOutput` | Strips code fences, validates fields, canonicalizes risk, caps list sizes; safe fallback if invalid |
| Safety merge | `pipeline.js#applySafety` | If red flags were detected, risk is forced to **High** and an emergency notice is added. Safety can only raise risk. |

If emergency language is detected and Gemini is unavailable, the API still returns a deterministic High-risk emergency response.

**No machine-learning model is trained here.** The "risk classification" is the LLM's structured output plus deterministic rule-based overrides. There are no accuracy metrics.

## API Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/` | Health check → `{ "status": "ok", "message": "Smart AI Wellness Checker API" }` |
| POST | `/api/analyze` | Body `{ "input": "..." }` |

Success (200):
```json
{ "summary": "...", "benefits": ["..."], "warnings": ["..."], "recommendation": "...",
  "riskLevel": "Low | Moderate | High",
  "safety": { "redFlags": [], "emergency": false }, "disclaimer": "..." }
```
Errors: `400` invalid input (`{"error": "Please provide ingredients or symptoms."}`), `429` rate limited, `500` not configured, `502` Gemini failure, `504` timeout.

## Project Structure
```
smart-ai-wellness-checker/
├── backend/
│   ├── server.js          # Express app, routes, Gemini call
│   ├── pipeline.js        # Validation, safety, enrichment, prompt, normalization
│   ├── pipeline.test.js   # Unit tests (node --test)
│   └── .env.example
├── frontend/
│   └── src/ (App.jsx, components/ResultCard.jsx, components/RiskBadge.jsx, index.css, main.jsx)
├── README.md
└── .gitignore
```

## Environment Variables
**backend/.env** (never committed)
| Name | Description |
|---|---|
| `GEMINI_API_KEY` | Required. Get one at https://aistudio.google.com/apikey |
| `PORT` | Default `5000` |
| `GEMINI_MODEL` | Optional, default `gemini-2.5-flash` |
| `CORS_ORIGIN` | Optional, comma-separated allowed origins, default `http://localhost:5173` |

**frontend/.env** (optional, public): `VITE_API_URL=http://localhost:5000`. The Gemini key is never given to the frontend.

## Local Setup
```bash
git clone <your-repo-url> && cd smart-ai-wellness-checker
cp backend/.env.example backend/.env     # then paste your key
cd backend && npm install && cd ../frontend && npm install
```

## Running the Backend
```bash
cd backend
npm start        # or: npm run dev
npm test         # unit tests for the deterministic pipeline
curl localhost:5000/
```

## Running the Frontend
```bash
cd frontend
npm run dev      # http://localhost:5173
```

## Example Inputs
`Turmeric and black pepper` · `Ashwagandha supplement` · `I drink 5 cups of coffee every day` · `High sugar intake` · `I have persistent fever and difficulty breathing` (triggers the emergency path)

## Security
- Gemini key lives only in backend `process.env`; no `VITE_` secret exists
- `.env` is git-ignored; `.env.example` has placeholders only
- Server-side validation (type, empty, 2000-char cap) and a 10 KB body limit
- CORS allow-list, rate limit (20 requests/min/IP on `/api/`)
- Logs never include user input; error messages never include the key
- Prompt-injection mitigation: user text is delimited and declared as data (reduces, does not eliminate, risk)

## Limitations
- LLM output can be wrong or incomplete; the local rules cover only a handful of ingredients
- Red-flag detection is keyword-based: it can miss paraphrases and has no multilingual support
- No personalization (age, medications, conditions, pregnancy) and no citations
- English only; no persistence or user accounts
- Gemini integration was not exercised end-to-end in the build sandbox (see below); verify with your own key

## Future Improvements
Source-cited retrieval (RAG over trusted references), medication-interaction database, multilingual safety detection, response caching, evaluation set for prompt regression tests, deployment (Render/Railway for backend, Vercel/Netlify for frontend; set `CORS_ORIGIN` and `VITE_API_URL`).

## Disclaimer
This application provides general wellness information for educational purposes. It is **not** a medical device or diagnostic system and is not a substitute for professional medical advice, diagnosis, or treatment. In an emergency, contact local emergency services immediately.
