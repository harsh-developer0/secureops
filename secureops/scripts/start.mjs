// Starts sample app, backend and dashboard together. Press Ctrl+C to stop all.
import { spawn } from "node:child_process";
import { existsSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  const token = randomBytes(24).toString("hex");
  writeFileSync(".env", readFileSync(".env", "utf8").replace("change-me-to-a-long-random-string", token));
  console.log("Created .env with a random INGEST_TOKEN.");
}

const services = [
  ["sample-app", "sample-app"],
  ["backend", "backend"],
  ["dashboard", "frontend"],
];
const children = services.map(([label, workspace]) => {
  const cmd = workspace === "frontend" ? "dev" : "start";
  const p = spawn(`npm run ${cmd} --workspace ${workspace}`, { shell: true, stdio: "inherit" });
  p.on("exit", (code) => console.log(`[${label}] exited with code ${code}`));
  return p;
});

console.log("\nSecureOps starting. Open http://localhost:5173  (Ctrl+C to stop)\n");
const stop = () => { for (const c of children) c.kill(); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
