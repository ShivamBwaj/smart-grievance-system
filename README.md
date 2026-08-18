# CivicLens

AI grievance intake for Bhopal Municipal Corporation. Built for VITISH '26 / BGI problem **BT1P1**.

One OpenAI call classifies a complaint (language, department, priority, SLA, duplicates). The UI is a Trench-style ops console.

## Run

```bash
cp .env.example .env.local
# paste OPENAI_API_KEY — without it, a keyword fallback still demos the UI
npm install
npm run dev
```

Then open http://localhost:3000 and **Log in** (or hit http://localhost:3000/login).

## Roles & demo accounts

Auth is a demo layer (localStorage — no backend yet). One-click "demo role" buttons on the login screen, or sign in / create an account. Password for all demo accounts: `demo123`.

| Role | Email | Lands on | Sees |
|---|---|---|---|
| Citizen | `meena@bhopal.in` | `/citizen` | File & track own grievances, Me Too |
| Officer | `rsharma@bmc.gov.in` | `/ops/queue` | Own assigned queue (toggle to all-city), HITL override |
| Admin | `admin@bmc.gov.in` | `/ops` | City-wide dashboard, analytics, hotspots, audit |

New sign-ups default to Citizen; officer/admin can be chosen on the signup form for the demo. Routes are role-guarded client-side and redirect to `/login` when signed out.

## Workflow coverage

One OpenAI call (`OPENAI_MODEL`, default `gpt-4o-mini`) does language detect → translate → classify → severity/priority → department + ward routing → confidence → duplicate clustering, in a single pass. No key → local keyword fallback keeps the demo alive.

- **Intake** (`/citizen`) — text / voice / photo / WhatsApp, GPS, anonymous whistleblower, nearby "Me Too".
- **Track** (`/track?id=…`) — public status by ID: progress stepper, timeline, explainability, before/after resolution photo, SLA, satisfaction rating.
- **Notifications** — status updates surfaced back to the citizen on their portal.
- **Officer** (`/ops/queue`) — own assignments (toggle all-city), HITL override, assign, **resolution-photo upload → resolve**.
- **Admin** (`/ops`, `/ops/analytics`, `/ops/hotspots`) — city dashboard, workload/priority/channel charts, ward hotspots, **escalations (SLA + urgent)**, **officer scorecard** (open / resolved / avg time / rating).

## Dev note

`next dev` and `next build` share `.next`; if you run a build then dev you may hit a stale-module error — `rm -rf .next` and restart.

## Team

Manan Singhal · Shivam Bhardwaj · Aagam Ashish Shah · Parnika Sen · Kummetha Chenna Pranav Reddy · Aakash Mutum
