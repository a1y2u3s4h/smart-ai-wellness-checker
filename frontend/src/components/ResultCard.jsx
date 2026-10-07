import { Sparkles, CheckCircle2, AlertTriangle, Lightbulb, Info, PhoneCall } from "lucide-react";
import RiskBadge, { RISK_STYLES } from "./RiskBadge.jsx";

function Section({ icon: Icon, title, tone, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <h3 className={`mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide ${tone}`}>
        <Icon className="h-4 w-4" aria-hidden="true" /> {title}
      </h3>
      {children}
    </section>
  );
}

function List({ items, Icon, color, empty }) {
  if (!items?.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} aria-hidden="true" /> <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ResultCard({ result }) {
  const accent = { Low: "border-t-emerald-500", Moderate: "border-t-amber-500", High: "border-t-red-500" }[result.riskLevel] ?? "border-t-slate-400";
  return (
    <article aria-live="polite" className={`rounded-2xl border-t-4 ${accent} bg-white p-5 text-slate-900 shadow-xl shadow-black/30 sm:p-7`}>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
          <Sparkles className="h-5 w-5 text-emerald-600" aria-hidden="true" /> AI Wellness Analysis
        </h2>
        <div className="flex items-center gap-2 text-sm text-slate-600">Risk Level: <RiskBadge level={result.riskLevel} /></div>
      </header>

      {result.safety?.emergency && (
        <div role="alert" className="mb-5 flex gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
          <PhoneCall className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium">Possible urgent symptoms detected ({result.safety.redFlags.join(", ")}). Please seek emergency or professional medical care now.</p>
        </div>
      )}

      <div className="space-y-4">
        <Section icon={Info} title="Summary" tone="text-slate-600"><p className="text-sm leading-relaxed text-slate-700">{result.summary}</p></Section>
        <div className="grid gap-4 md:grid-cols-2">
          <Section icon={CheckCircle2} title="Potential Benefits" tone="text-emerald-700">
            <List items={result.benefits} Icon={CheckCircle2} color="text-emerald-600" empty="No specific benefits identified." />
          </Section>
          <Section icon={AlertTriangle} title="Things to Consider" tone="text-amber-700">
            <List items={result.warnings} Icon={AlertTriangle} color="text-amber-600" empty="No specific warnings identified." />
          </Section>
        </div>
        <Section icon={Lightbulb} title="Recommendation" tone="text-emerald-700">
          <p className="text-sm leading-relaxed text-slate-700">{result.recommendation}</p>
        </Section>
      </div>

      <footer className="mt-5 flex gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p><strong>Safety Notice:</strong> {result.disclaimer || "This tool provides general wellness information and is not a substitute for professional medical advice."}</p>
      </footer>
    </article>
  );
}
