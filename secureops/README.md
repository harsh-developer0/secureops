# SecureOps (Stage 1, Windows-friendly)

React + Vite + Tailwind dashboard, Express backend, SQLite (built into Node, nothing to compile), and a small sample app to monitor.

## Requirements
- Node.js **22.13 or newer** (Node 24 works). Check with `node -v`.
- VS Code. Docker Desktop is only needed for the optional Docker step.

## Run it (2 commands)
Open the project folder in VS Code, open a terminal (Ctrl+`), then:
```powershell
npm install
npm start
```
Open **http://localhost:5173**. Press Ctrl+C in the terminal to stop everything.

`npm start` creates `.env` for you (with a random token), then starts the sample app (port 4000), backend (port 3001) and dashboard (port 5173). The database file is created automatically at `data/secureops.db`.

## Test
```powershell
npm test
```

## See monitoring react to a failure
While running, open a second terminal and watch the Monitoring page, then stop the app by pressing Ctrl+C and restart, or run the sample app in Docker (below) and `docker compose stop`. After about 30 seconds a failing health check raises an alert and an incident.

## Optional: sample app in Docker
Docker Desktop must be running. The dashboard monitors port 4000, so stop `npm start` first or Docker will report the port as busy.
```powershell
docker compose up --build -d
curl http://localhost:4000/health
docker compose down
```

## Optional: labelled sample data
```powershell
cd backend
npm run seed:sample            # rows are badged "sample data" in the UI
npm run seed:sample -- --clear # remove them
```

## Not built yet
GitHub Actions CI (Gitleaks, Trivy), the local deployer, automatic rollback, and the three demo scenarios. Pipeline, Security, Deployments and Rollback pages show empty states until then.

## Notes
- The first run prints no SQLite warning; it is suppressed on purpose because `node:sqlite` is marked experimental in Node.
- The API exposes no Docker commands and no credentials. Never commit `.env`.
