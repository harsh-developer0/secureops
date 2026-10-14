import { createApp } from "./app.js";
import { startMonitor } from "./monitor.js";

const port = Number(process.env.BACKEND_PORT || 3001);
const target = process.env.TARGET_URL || "http://localhost:4000";
const seconds = Number(process.env.CHECK_INTERVAL_SECONDS || 10);

createApp().listen(port, () => {
  console.log(`SecureOps backend on http://localhost:${port}`);
  console.log(`Monitoring ${target}/health every ${seconds}s`);
});
startMonitor(target, seconds);
