import { useEffect, useState } from "react";

// Fetches JSON from the backend and refreshes every 5 seconds.
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null });
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(path).then((r) => r.json()).then((data) => alive && setState({ data, error: null }))
        .catch(() => alive && setState({ data: null, error: "Backend not reachable. Is it running on port 3001?" }));
    load();
    const id = setInterval(load, 5000);
    return () => { alive = false; clearInterval(id); };
  }, [path]);
  return state;
}

export const Card = ({ title, children, className = "" }) => (
  <section className={`rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 ${className}`}>
    {title && <h3 className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>}
    {children}
  </section>
);

const colors = {
  green: "bg-emerald-500", red: "bg-red-500", amber: "bg-amber-500", gray: "bg-slate-400",
};
const tone = (s) => {
  const v = String(s || "").toLowerCase();
  if (["success", "passed", "pass", "deployed", "healthy", "resolved", "ok"].includes(v)) return "green";
  if (["failure", "failed", "blocked", "open", "unhealthy", "rolled_back"].includes(v)) return "red";
  if (["running", "pending"].includes(v)) return "amber";
  return "gray";
};
export const Status = ({ value }) => {
  const c = tone(value);
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${colors[c]} ${c === "amber" ? "pulse-dot" : ""}`} />
      {value || "unknown"}
    </span>
  );
};

export const SampleBadge = ({ source }) =>
  source === "sample" ? (
    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">sample data</span>
  ) : null;

export const Empty = ({ children }) => (
  <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">{children}</p>
);

export function Table({ columns, rows, empty }) {
  if (!rows?.length) return <Empty>{empty}</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {columns.map((c) => <th key={c.label} className="py-2 pr-4 font-medium">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
              {columns.map((c) => <td key={c.label} className="py-2 pr-4">{c.render(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Simple SVG line chart of response times (real monitoring records).
export function LineChart({ values }) {
  if (values.length < 2) return <Empty>Waiting for more health checks…</Empty>;
  const w = 600, h = 120, max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * (h - 10) - 5}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" strokeWidth="2" className="stroke-teal-500" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
