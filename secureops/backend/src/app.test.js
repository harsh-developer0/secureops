import { test } from "node:test";
import assert from "node:assert";
process.env.DB_PATH = "../data/test.db";
process.env.INGEST_TOKEN = "t";
const { createApp } = await import("./app.js");

test("health, ingest auth, overview", async () => {
  const server = createApp().listen(0);
  const base = `http://localhost:${server.address().port}`;
  assert.equal((await fetch(`${base}/health`)).status, 200);
  const bad = await fetch(`${base}/api/ingest/pipeline`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  assert.equal(bad.status, 401);
  const good = await fetch(`${base}/api/ingest/pipeline`, {
    method: "POST", headers: { "content-type": "application/json", "x-ingest-token": "t" },
    body: JSON.stringify({ commit_sha: "abc1234", status: "failure", security_status: "failed",
      findings: [{ tool: "trivy", severity: "CRITICAL", title: "test finding" }] }),
  });
  assert.equal(good.status, 201);
  const sec = await (await fetch(`${base}/api/security`)).json();
  assert.equal(sec.gate, "blocked");
  server.close();
});
