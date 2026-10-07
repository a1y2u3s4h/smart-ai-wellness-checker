import { useState } from "react";
import { Leaf, Loader2, Wand2, X, AlertCircle } from "lucide-react";
import ResultCard from "./components/ResultCard.jsx";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const MAX = 2000;
const EXAMPLES = ["Turmeric", "Ashwagandha", "High caffeine intake", "High sugar diet"];
const isValidResult = (r) =>
  r && typeof r.summary === "string" && Array.isArray(r.benefits) && Array.isArray(r.warnings) &&
  typeof r.recommendation === "string" && ["Low", "Moderate", "High"].includes(r.riskLevel);

export default function App() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const len = input.length;
  const canSubmit = input.trim().length > 0 && len <= MAX && !loading;

  async function analyze(e) {
    e.preventDefault();
    if (!input.trim()) return setError("Please enter ingredients or a wellness concern first.");
    if (len > MAX) return setError(`Please keep your input under ${MAX} characters.`);
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: input.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "The server returned an error. Please try again.");
      if (!isValidResult(data)) throw new Error("Received an unexpected response from the server.");
      setResult(data);
    } catch (err) {
      setError(err instanceof TypeError ? "Can't reach the server. Check your connection and that the backend is running." : err.message);
    } finally {
      setLoading(false);
    }
  }

  const clear = () => { setInput(""); setResult(null); setError(""); };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/40"><Leaf className="h-6 w-6 text-emerald-400" aria-hidden="true" /></div>
        <div>
          <h1 className="text-lg font-bold leading-tight sm:text-xl">Smart Wellness AI</h1>
          <p className="text-xs text-slate-400 sm:text-sm">AI-powered ingredient &amp; wellness intelligence</p>
        </div>
      </header>

      <section className="py-10 text-center sm:py-14">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Understand what you&apos;re putting <span className="text-emerald-400">into your body.</span></h2>
        <p className="mx-auto mt-4 max-w-xl text-slate-400">Analyze ingredients, supplements, food items, or general wellness concerns using AI.</p>
      </section>

      <main className="flex-1 space-y-6">
        <form onSubmit={analyze} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-black/30 backdrop-blur sm:p-6">
          <label htmlFor="q" className="mb-2 block text-sm font-semibold text-slate-200">What would you like to analyze?</label>
          <textarea
            id="q" rows={4} value={input} disabled={loading} onChange={(e) => setInput(e.target.value)}
            placeholder="Example: Turmeric, Ashwagandha, high caffeine intake..."
            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-60"
          />
          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Example inputs">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" disabled={loading} onClick={() => setInput(ex)}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300 disabled:opacity-50">{ex}</button>
              ))}
            </div>
            <span className={`shrink-0 text-xs tabular-nums ${len > MAX ? "font-semibold text-red-400" : "text-slate-500"}`}>{len} / {MAX}</span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={!canSubmit}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 sm:flex-none">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Analyzing...</> : <><Wand2 className="h-4 w-4" aria-hidden="true" /> Analyze with AI</>}
            </button>
            {(result || error) && !loading && (
              <button type="button" onClick={clear} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800">
                <X className="h-4 w-4" aria-hidden="true" /> Clear
              </button>
            )}
          </div>
        </form>

        {loading && (
          <div role="status" className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" aria-hidden="true" /> Analyzing with AI...
          </div>
        )}
        {error && (
          <div role="alert" className="flex gap-3 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /> <p>{error}</p>
          </div>
        )}
        {result && <ResultCard result={result} />}
      </main>

      <footer className="mt-10 border-t border-slate-800 pt-5 text-center text-xs text-slate-500">
        General wellness information only. Not a diagnostic tool and not a substitute for professional medical advice.
      </footer>
    </div>
  );
}
