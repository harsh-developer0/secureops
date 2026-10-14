import { db } from "./db.js";

const FAILS_BEFORE_INCIDENT = 3;
let consecutiveFails = 0;

// Calls the target app's /health once and stores the real measurement.
export async function checkOnce(targetUrl) {
  const start = Date.now();
  let statusCode = null;
  let ok = 0;
  let error = null;
  try {
    const res = await fetch(`${targetUrl}/health`, { signal: AbortSignal.timeout(3000) });
    statusCode = res.status;
    ok = res.ok ? 1 : 0;
    if (!res.ok) error = `HTTP ${res.status}`;
  } catch (e) {
    error = e.name === "TimeoutError" ? "timeout" : "unreachable";
  }
  const ms = Date.now() - start;
  db.prepare(
    "INSERT INTO monitoring_records (target, status_code, response_ms, ok, error) VALUES (?,?,?,?,?)"
  ).run(targetUrl, statusCode, ms, ok, error);
  updateIncidents(ok, error);
  return { ok: !!ok, ms, error };
}

// Basic alert rule: 3 failed checks in a row opens an incident; a success resolves it.
function updateIncidents(ok, error) {
  const open = db.prepare("SELECT id FROM incidents WHERE status='open' AND source='real' AND title LIKE 'Health check failing%'").get();
  if (ok) {
    consecutiveFails = 0;
    if (open) db.prepare("UPDATE incidents SET status='resolved', resolved_at=datetime('now') WHERE id=?").run(open.id);
    return;
  }
  consecutiveFails++;
  if (consecutiveFails >= FAILS_BEFORE_INCIDENT && !open) {
    db.prepare("INSERT INTO incidents (title, severity) VALUES (?, 'high')")
      .run(`Health check failing (${error})`);
  }
}

export function startMonitor(targetUrl, seconds) {
  checkOnce(targetUrl);
  return setInterval(() => checkOnce(targetUrl), seconds * 1000);
}
