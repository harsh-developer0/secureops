import express from "express";
import cors from "cors";
import { db } from "./db.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Backend's own health + version endpoints.
  app.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));
  app.get("/version", (_req, res) => res.json({ name: "secureops-backend", version: "1.0.0" }));

  const all = (sql, ...p) => db.prepare(sql).all(...p);
  const one = (sql, ...p) => db.prepare(sql).get(...p);

  // Security gate: release is blocked if the latest run has CRITICAL/HIGH findings
  // or a failed security status. 'unknown' means no data yet.
  function securityGate() {
    const run = one("SELECT * FROM pipeline_runs ORDER BY id DESC LIMIT 1");
    if (!run) return { gate: "unknown", reason: "No pipeline runs recorded yet." };
    const bad = one(
      "SELECT COUNT(*) AS n FROM security_findings WHERE run_id=? AND severity IN ('CRITICAL','HIGH')", run.id
    ).n;
    if (bad > 0 || run.security_status === "failed")
      return { gate: "blocked", reason: `${bad} critical/high finding(s) in latest run.` };
    return { gate: "pass", reason: "No critical/high findings in latest run." };
  }

  app.get("/api/overview", (_req, res) => {
    const current = one("SELECT * FROM deployments WHERE status='deployed' ORDER BY id DESC LIMIT 1");
    const lastCheck = one("SELECT * FROM monitoring_records ORDER BY id DESC LIMIT 1");
    res.json({
      pipeline: one("SELECT * FROM pipeline_runs ORDER BY id DESC LIMIT 1") || null,
      currentVersion: current?.version || null,
      health: lastCheck ? { ok: !!lastCheck.ok, responseMs: lastCheck.response_ms, checkedAt: lastCheck.created_at } : null,
      recentDeployments: all("SELECT * FROM deployments ORDER BY id DESC LIMIT 5"),
      incidents: all("SELECT * FROM incidents ORDER BY id DESC LIMIT 5"),
      gate: securityGate(),
      hasSampleData: !!one("SELECT 1 AS x FROM pipeline_runs WHERE source='sample' LIMIT 1"),
    });
  });

  app.get("/api/pipeline", (_req, res) => res.json(all("SELECT * FROM pipeline_runs ORDER BY id DESC LIMIT 20")));
  app.get("/api/security", (_req, res) =>
    res.json({ ...securityGate(), findings: all("SELECT * FROM security_findings ORDER BY id DESC LIMIT 100") }));
  app.get("/api/deployments", (_req, res) => res.json(all("SELECT * FROM deployments ORDER BY id DESC LIMIT 50")));
  app.get("/api/rollbacks", (_req, res) => res.json(all("SELECT * FROM rollback_history ORDER BY id DESC LIMIT 50")));
  app.get("/api/incidents", (_req, res) => res.json(all("SELECT * FROM incidents ORDER BY id DESC LIMIT 50")));

  app.get("/api/monitoring", (_req, res) => {
    const recent = all("SELECT * FROM monitoring_records ORDER BY id DESC LIMIT 60").reverse();
    const total = recent.length;
    const failed = recent.filter((r) => !r.ok).length;
    const times = recent.filter((r) => r.ok).map((r) => r.response_ms);
    const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
    res.json({
      records: recent,
      summary: { checks: total, errorRatePct: total ? Math.round((failed / total) * 100) : 0, avgResponseMs: avg },
      alerts: all("SELECT * FROM incidents WHERE status='open' ORDER BY id DESC"),
    });
  });

  // CI/helper scripts post real results here. Protected by a shared token.
  app.post("/api/ingest/pipeline", (req, res) => {
    if (!process.env.INGEST_TOKEN || req.get("x-ingest-token") !== process.env.INGEST_TOKEN)
      return res.status(401).json({ error: "invalid token" });
    const { commit_sha, branch, status, tests_status, security_status, workflow_url, findings = [] } = req.body || {};
    if (!commit_sha || !status) return res.status(400).json({ error: "commit_sha and status required" });
    const run = db.prepare(
      "INSERT INTO pipeline_runs (commit_sha, branch, status, tests_status, security_status, workflow_url) VALUES (?,?,?,?,?,?)"
    ).run(commit_sha, branch ?? null, status, tests_status ?? null, security_status ?? null, workflow_url ?? null);
    const ins = db.prepare("INSERT INTO security_findings (run_id, tool, severity, title, detail) VALUES (?,?,?,?,?)");
    for (const f of findings) ins.run(Number(run.lastInsertRowid), f.tool, f.severity, f.title, f.detail ?? null);
    res.status(201).json({ id: Number(run.lastInsertRowid) });
  });

  return app;
}
