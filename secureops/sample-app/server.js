import express from "express";
const app = express();
const VERSION = process.env.APP_VERSION || "1.0.0";
// FAIL_HEALTH=true makes /health return 500: used for the controlled rollback demo.
const FAIL = process.env.FAIL_HEALTH === "true";

app.get("/", (_req, res) => res.send(`Sample app v${VERSION}`));
app.get("/health", (_req, res) =>
  FAIL ? res.status(500).json({ status: "unhealthy" }) : res.json({ status: "ok", version: VERSION }));
app.get("/version", (_req, res) => res.json({ version: VERSION, commit: process.env.COMMIT_SHA || "local" }));

app.listen(4000, () => console.log(`Sample app v${VERSION} on :4000`));
