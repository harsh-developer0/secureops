// Inserts clearly-labelled SAMPLE rows (source='sample') so you can preview the UI.
// The UI shows a "sample data" badge when these exist. Remove with: npm run seed:sample -- --clear
import { db } from "./db.js";

if (process.argv.includes("--clear")) {
  for (const t of ["pipeline_runs", "security_findings", "deployments", "incidents", "rollback_history"])
    db.prepare(`DELETE FROM ${t} WHERE source='sample'`).run();
  console.log("Sample data removed.");
  process.exit(0);
}
const run = db.prepare(
  "INSERT INTO pipeline_runs (source, commit_sha, branch, status, tests_status, security_status, workflow_url) VALUES ('sample','a1b2c3d','main','success','passed','passed','https://github.com/example/repo/actions/runs/1')"
).run();
db.prepare("INSERT INTO security_findings (source, run_id, tool, severity, title) VALUES ('sample',?,'trivy','LOW','Sample: low severity package issue')").run(Number(run.lastInsertRowid));
db.prepare("INSERT INTO deployments (source, version, commit_sha, image, status, health_result) VALUES ('sample','1.0.0','a1b2c3d','secureops-sample:a1b2c3d','deployed','healthy')").run();
db.prepare("INSERT INTO incidents (source, title, severity, status) VALUES ('sample','Sample incident','low','resolved')").run();
console.log("Sample data added (labelled 'sample' in the UI).");
