# Project A.E.G.I.S — Secure Identity

Password hashing, risk-aware login, TOTP step-up for new IP/device contexts, MySQL audit trail, and a React security-flow visualizer.

**Full documentation:** [docs/HOW_IT_WORKS.md](docs/HOW_IT_WORKS.md)

**Quick start**

1. Import DB: `Get-Content .\database\schema.sql -Raw | mysql -u root -p` (from repo root; PowerShell)
2. `server/.env` from `server/.env.example`
3. Terminal 1: `cd server && npm install && npm run dev`
4. Terminal 2: `cd visualization && npm install && npm run dev`
