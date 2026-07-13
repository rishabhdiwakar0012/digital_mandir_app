# Digital Mandir

Digital Mandir is a full-stack spiritual wellness platform for performing digital *mantra jaap* (chanting/counting), tracking streaks and progress, and engaging with festivals, deities, and a community leaderboard. The project is organized as a monorepo with a mobile app, an admin dashboard, a marketing landing page, a backend API, and a shared types package.

## Project Structure

```
DigitalMandir/
├── backend/     NestJS REST API (MongoDB, JWT auth, push notifications)
├── frontend/    React Native (Expo) mobile app — iOS, Android, Web
├── admin/       Next.js admin dashboard for content & user management
├── landing/     Next.js marketing/landing website
├── shared/      Shared TypeScript types, Zod schemas & constants
└── docker-compose.yml
```

| Package    | Stack                              | Purpose                                            |
| ---------- | ----------------------------------- | --------------------------------------------------- |
| `backend`  | NestJS 11, MongoDB (Mongoose), JWT  | Core API — auth, jaap sessions, content, notifications |
| `frontend` | React Native (Expo 54), TypeScript  | Mobile app for chanting mantras and tracking streaks |
| `admin`    | Next.js 16, Tailwind CSS, ECharts   | Internal dashboard for managing content and users    |
| `landing`  | Next.js 16, Tailwind CSS            | Public marketing site, privacy policy, account deletion |
| `shared`   | TypeScript, Zod                     | Types/schemas/constants shared across apps            |

## Features

- **Mantra Jaap tracking** — count-based chanting sessions with custom mantras, deities, and festivals
- **Streaks & levels** — daily streak calendar, progress levels, and a community leaderboard
- **Authentication** — email/phone login and Google Sign-In, JWT access/refresh tokens
- **Push notifications** — daily reminders and automated engagement notifications via Firebase Cloud Messaging
- **Admin dashboard** — manage deities, mantras, festivals, sections, users, and view analytics
- **Multi-language support** — i18n on both backend and mobile app
- **Media uploads** — S3-backed asset storage for content management

## Prerequisites

- Node.js >= 18
- npm >= 9
- MongoDB (local instance or Docker)
- Expo CLI (installed automatically via `npx`)
- Android Studio / Xcode for native builds (optional — Expo Go works for quick testing)

## Getting Started

### 1. Install dependencies

```bash
npm run install:all
```

This installs the root workspace plus `backend`, `frontend`, `shared`, and `admin` dependencies. Install `landing` separately if needed:

```bash
cd landing && npm install
```

### 2. Configure environment variables

Each app that needs configuration ships an `.env.example`:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in MongoDB URI, JWT secrets, Google OAuth credentials, and Firebase credentials as described in the comments of each file.

### 3. Build the shared package

```bash
npm run shared:build
```

### 4. Run the apps

```bash
# Backend API (http://localhost:3000)
npm run backend:dev

# Mobile app (Expo dev server)
npm run frontend:dev

# Admin dashboard (http://localhost:3001 in production, localhost:3000 dev)
npm run admin:dev

# Landing page
cd landing && npm run dev

# Backend + Frontend together
npm run dev
```

See each package's own README for more detail:

- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)
- [admin/README.md](admin/README.md)
- [landing/README.md](landing/README.md)

## Docker

A `docker-compose.yml` is provided to run MongoDB, the backend, and the admin dashboard together:

```bash
docker-compose up -d
```

Set `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and Google OAuth variables via a `.env` file at the repo root (or your shell environment) before starting — see `docker-compose.yml` for the full list.

## Scripts (root `package.json`)

| Script                | Description                              |
| ---------------------- | ----------------------------------------- |
| `install:all`          | Install dependencies across all workspaces |
| `dev`                  | Run backend + frontend concurrently        |
| `backend:dev/build/start` | Backend dev server / build / production start |
| `frontend:dev/web/android/ios` | Run the mobile app on a given target |
| `admin:dev/build/start` | Admin dashboard dev server / build / production start |
| `shared:build`         | Compile the shared package                 |
| `lint`                 | Lint backend and frontend                  |

## License

Proprietary — all rights reserved.
