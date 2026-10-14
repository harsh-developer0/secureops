import { DatabaseSync } from "node:sqlite"; // built into Node, nothing to compile
import fs from "node:fs";
import path from "node:path";

const dbPath = path.resolve(process.env.DB_PATH || "../data/secureops.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");

// `source` is 'real' for data produced by this system, 'sample' for demo rows.
db.exec(`
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL DEFAULT 'real',
  commit_sha TEXT NOT NULL,
  branch TEXT,
  status TEXT NOT NULL,            -- success | failure | running
  tests_status TEXT,               -- passed | failed | unknown
  security_status TEXT,            -- passed | failed | unknown
  workflow_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS security_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL DEFAULT 'real',
  run_id INTEGER,
  tool TEXT NOT NULL,              -- trivy | gitleaks
  severity TEXT NOT NULL,          -- CRITICAL | HIGH | MEDIUM | LOW
  title TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS deployments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL DEFAULT 'real',
  version TEXT NOT NULL,
  commit_sha TEXT,
  image TEXT,
  status TEXT NOT NULL,            -- deployed | failed | rolled_back
  health_result TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS monitoring_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target TEXT NOT NULL,
  status_code INTEGER,
  response_ms INTEGER,
  ok INTEGER NOT NULL,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL DEFAULT 'real',
  title TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',   -- open | resolved
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);
CREATE TABLE IF NOT EXISTS rollback_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL DEFAULT 'real',
  from_version TEXT NOT NULL,
  to_version TEXT NOT NULL,
  reason TEXT,
  recovery_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);
