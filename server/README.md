# CivicLens backend (Express + SQLite)

Standalone API that serves the same `/api` contract the Next.js app used, backed
by **persistent SQLite** instead of an ephemeral JSON file. Runs on the Azure VM;
the Vercel frontend proxies `/api/*` to it server-side (see root `next.config.ts`).

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness |
| GET | `/api/complaints` | list, newest first |
| POST | `/api/complaints` | file a grievance (runs AI classify + clustering) |
| GET | `/api/complaints/:id` | one ticket |
| PATCH | `/api/complaints/:id` | officer update (status, assign, override, rating) |
| POST | `/api/complaints/:id/upvote` | Me Too |
| GET | `/api/analytics` | dashboard rollups |

## Run locally
```bash
cd server
cp .env.example .env      # add OPENAI_API_KEY (optional)
npm install
npm start                 # http://127.0.0.1:8000
```

First boot loads `seed.json` (the Chennai demo dataset) into `data/civiclens.db`.
Delete `data/civiclens.db*` to reseed.

## Deploy (Azure VM, behind the existing nginx on port 80)
See [`docs/BACKEND-DEPLOYMENT.md`](../docs/BACKEND-DEPLOYMENT.md).
