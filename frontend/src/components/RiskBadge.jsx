import { ShieldCheck, ShieldAlert, Siren } from "lucide-react";

export const RISK_STYLES = {
  Low: { Icon: ShieldCheck, label: "LOW RISK", cls: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  Moderate: { Icon: ShieldAlert, label: "MODERATE RISK", cls: "bg-amber-50 text-amber-800 border-amber-300" },
  High: { Icon: Siren, label: "HIGH RISK", cls: "bg-red-50 text-red-800 border-red-300" },
};

export default function RiskBadge({ level }) {
  const { Icon, label, cls } = RISK_STYLES[level] ?? RISK_STYLES.Moderate;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${cls}`}>
      <Icon className="h-4 w-4" aria-hidden="true" /> {label}
    </span>
  );
}
