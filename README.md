# All In One Website

A personal full-stack web application combining multiple tools and projects under a single authenticated hub.

## Features

| Module | Permission | Description |
|---|---|---|
| **Dashboard** | — | Home screen with tiles for accessible modules |
| **About Me** | `view:personal` | Personal portfolio page — skills, timeline, trading, bodybuilding |
| **AI Chat** | `view:terminal` | macOS-style terminal with slash commands and Claude AI integration |
| **Get Gapped** | `view:gapped` | League of Legends stats tool — summoner profiles, champion mastery, match history |
| **Gym Tracker** | `view:gymtracker` | Full fitness tracker — workouts, exercise library, templates, body measurements, progress stats |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JSX, React 18 UMD + Babel Standalone (no build step) |
| Backend | Bun + Hono 4 (TypeScript), Port 3001 |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs (server-side), sessionStorage (client) |
| i18n | DE / EN via `LangCtx` + `STRINGS` map |

## Project Structure

```
All In One Website/
├── index.html              # Hub entry point
├── app.jsx                 # App root — routing, auth, lazy module loading
├── shared/                 # Shared components: NavBar, i18n, TweaksPanel, SettingsPage
├── login/                  # Login + registration (multi-step wizard)
├── dashboard/              # Dashboard with permission-gated tiles
├── about-me/               # Personal portfolio page
├── ai-chat/                # Terminal-style AI chat
├── get-gapped/             # LoL stats SPA (iframe)
├── gym-tracker/            # Gym tracker SPA (iframe)
└── server/                 # Bun + Hono backend
    ├── index.ts
    ├── db.ts
    ├── routes/
    └── migrations/
```

## Setup

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- PostgreSQL

### Environment Variables

Create a `.env` file in `server/`:

```env
DATABASE_URL=postgres://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-here
ALLOWED_ORIGIN=http://localhost:3000
```

### Install & Run

```bash
cd server
bun install
bun run index.ts
```

The server starts on **port 3001**. Open `index.html` directly in a browser (no build step required).

### Database Migrations

Run migrations in order:

```bash
psql $DATABASE_URL -f server/migrations/001_create_users.sql
psql $DATABASE_URL -f server/migrations/002_create_contacts.sql
psql $DATABASE_URL -f server/migrations/003_create_permissions.sql
psql $DATABASE_URL -f server/migrations/004_create_user_permissions.sql
psql $DATABASE_URL -f server/migrations/005_add_manage_users_permission.sql
psql $DATABASE_URL -f server/migrations/006_replace_placeholder_permissions.sql
psql $DATABASE_URL -f server/migrations/gym_003_measurements.sql
psql $DATABASE_URL -f server/migrations/gym_004_exercises.sql
psql $DATABASE_URL -f server/migrations/gym_005_profiles_fitness_fields.sql
psql $DATABASE_URL -f server/migrations/gym_006_workout_templates.sql
psql $DATABASE_URL -f server/migrations/gym_007_workouts.sql
psql $DATABASE_URL -f server/migrations/gym_008_measurements_source.sql
```

### Riot API (Get Gapped)

Copy the example config and insert your key:

```bash
cp riot-api-config.example.js riot-api-config.js
```

> Note: Riot Dev Keys expire daily and must be renewed manually.

## Authentication

The hub uses a role-based permission system:

- **Superadmin** (`is_superadmin = true`) — all permissions automatically
- **Regular users** — explicit per-permission assignment via `user_permissions` table
- Permissions are loaded after login and stored in `sessionStorage`
- Protected JSX modules are served JWT-gated via `/api/src/:key`

## GDPR

The application implements Art. 15, 17, and 20 DSGVO:

- `GET /api/auth/me` — data access (Art. 15)
- `DELETE /api/auth/account` — account deletion with password confirmation (Art. 17)
- `GET /api/auth/export` — full JSON data export (Art. 20)

The Gym Tracker has its own separate auth and identical GDPR endpoints under `/api/gym/auth/`.

## License

Private project — not licensed for public use.
