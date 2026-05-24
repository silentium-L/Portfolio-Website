# All In One Website

> **Hobby project** — a personal full-stack hub that bundles multiple tools and SPAs behind a single authenticated interface.
> Built for fun and self-improvement; demonstrates end-to-end development from database design to frontend UX.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?style=flat&logo=bun&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E36002?style=flat&logo=hono&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=flat&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)

---

## What's inside

| Module | Description |
|---|---|
| **Hub & Auth** | Unified login with JWT, role-based permissions, lazy-loaded protected modules |
| **Dashboard** | Permission-gated tile grid — users only see what they have access to |
| **About Me** | Personal portfolio page — skills, timeline, trading & bodybuilding sections |
| **AI Chat** | macOS-style terminal UI with slash-commands and Claude AI integration |
| **Get Gapped** | League of Legends stats tool — summoner profiles, champion mastery, match history via Riot API |
| **Gym Tracker** | Full fitness SPA — workout logging, exercise library (139 exercises), templates, body measurements, progress charts |

---

## Architecture highlights

**No build step on the frontend.** React 18 UMD + Babel Standalone run directly in the browser. This keeps the development loop instant and the deployment dead-simple — open `index.html` and go.

**Permission-gated JSX delivery.** Protected modules are served by the backend as raw JSX, transformed client-side with Babel after a JWT check. No module is ever exposed without authentication.

**Two independent auth systems.** The main hub and the Gym Tracker each have their own user tables and JWT flows (`/api/auth/*` vs `/api/gym/auth/*`), making each sub-app fully autonomous.

**GDPR-compliant by design.** Art. 15 (data access), Art. 17 (account deletion), and Art. 20 (data export) are implemented across both auth systems — not bolted on later.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend runtime | [Bun](https://bun.sh) |
| Backend framework | [Hono 4](https://hono.dev) (TypeScript) |
| Database | PostgreSQL — accessed only via `server/db.ts` |
| Validation | [Zod](https://zod.dev) on all mutations |
| Auth | JWT + bcryptjs, sessionStorage on client |
| Frontend | React 18 UMD + Babel Standalone (no build step) |
| i18n | DE / EN via `LangCtx` + `STRINGS` map in `shared/core.jsx` |
| Security | Rate limiting, `SecureHeaders`, parameterized queries throughout |

---

## Project structure

```
All In One Website/
├── index.html              # Hub entry point (no bundler)
├── app.jsx                 # App root — routing, auth state, lazy module loading
├── shared/                 # NavBar, i18n, TweaksPanel, SettingsPage
├── login/                  # Login + multi-step registration wizard
├── dashboard/              # Permission-gated dashboard tiles
├── about-me/               # Personal portfolio page
├── ai-chat/                # Terminal-style AI chat (Claude API)
├── get-gapped/             # LoL stats SPA (embedded in iframe)
│   ├── gapped-riot.jsx     # Riot API abstraction layer
│   ├── gapped-champions.jsx
│   └── gapped-match-detail.jsx
├── gym-tracker/            # Gym tracker SPA (embedded in iframe)
│   ├── workout.jsx         # Workout logging + template system
│   ├── history.jsx         # Workout + measurement history
│   ├── stats.jsx           # Progress charts
│   └── profile.jsx         # GDPR: account deletion + data export
└── server/
    ├── index.ts            # Hono app — CORS, rate limiting, routing
    ├── db.ts               # PostgreSQL connection pool
    ├── routes/             # auth, gym-auth, gym-workouts, gym-templates, ...
    └── migrations/         # Versioned SQL migrations (001 → gym_008)
```

---

## Local setup

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- PostgreSQL (local instance or Docker)

### 1. Environment variables

Create `server/.env`:

```env
DATABASE_URL=postgres://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-here
ALLOWED_ORIGIN=http://localhost:3000
```

### 2. Install dependencies & start server

```bash
cd server
bun install
bun run index.ts
```

Server starts on **port 3001**. Open `index.html` directly in the browser — no build step needed.

### 3. Run database migrations

```bash
psql $DATABASE_URL -f server/migrations/001_create_users.sql
psql $DATABASE_URL -f server/migrations/002_create_contacts.sql
psql $DATABASE_URL -f server/migrations/003_create_permissions.sql
psql $DATABASE_URL -f server/migrations/004_create_user_permissions.sql
psql $DATABASE_URL -f server/migrations/005_add_manage_users_permission.sql
psql $DATABASE_URL -f server/migrations/006_replace_placeholder_permissions.sql
# Gym Tracker migrations
psql $DATABASE_URL -f server/migrations/gym_003_measurements.sql
psql $DATABASE_URL -f server/migrations/gym_004_exercises.sql
psql $DATABASE_URL -f server/migrations/gym_005_profiles_fitness_fields.sql
psql $DATABASE_URL -f server/migrations/gym_006_workout_templates.sql
psql $DATABASE_URL -f server/migrations/gym_007_workouts.sql
psql $DATABASE_URL -f server/migrations/gym_008_measurements_source.sql
```

### 4. Riot API key (optional — Get Gapped only)

```bash
cp riot-api-config.example.js riot-api-config.js
# Insert your Riot Dev Key — expires daily, renew at developer.riotgames.com
```

---

## Permission system

Access to each module is controlled by named permission keys:

| Key | Grants access to |
|---|---|
| `view:personal` | About Me page |
| `view:terminal` | AI Chat terminal |
| `view:gapped` | Get Gapped (LoL stats) |
| `view:gymtracker` | Gym Tracker |
| `manage:users` | Admin panel |

- **Superadmin** (`is_superadmin = true`) — all permissions automatically, including future ones
- **Regular users** — explicit per-permission assignment via `user_permissions` table
- Permissions are resolved server-side on login and stored in `sessionStorage`

---

## GDPR compliance

Implemented across both auth systems (hub + gym tracker):

| Article | Endpoint | Description |
|---|---|---|
| Art. 15 | `GET /api/auth/me` | Access to stored personal data |
| Art. 17 | `DELETE /api/auth/account` | Account deletion with password confirmation |
| Art. 20 | `GET /api/auth/export` | Full JSON data export |

Gym Tracker mirrors the same rights under `/api/gym/auth/`.

---

## License

Private hobby project — not licensed for public use or redistribution.
