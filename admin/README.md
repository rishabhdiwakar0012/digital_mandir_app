# Digital Mandir — Admin Dashboard

Internal admin dashboard for managing Digital Mandir's content and users, built with Next.js 16 (App Router), Tailwind CSS, and ECharts.

## Features

- **Dashboard** — key metrics and activity overview
- **Content management** — deities, mantras, festivals, and page sections
- **User management** — view and manage registered users, view individual user detail pages
- **Leaderboard** — view community rankings
- **Notifications** — send/manage push notifications
- **Analytics** — charts and usage insights (via ECharts)
- **Authentication** — NextAuth-based login, protected route group

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [Tailwind CSS 4](https://tailwindcss.com)
- [TanStack Query](https://tanstack.com/query) for data fetching
- [Zustand](https://zustand-demo.pmnd.rs) for client state
- [NextAuth](https://authjs.dev) for authentication
- [ECharts](https://echarts.apache.org) for analytics charts
- [Axios](https://axios-http.com) for API calls

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file with at least:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Add any NextAuth-related variables (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`, etc.) as required by your deployment.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port your setup uses) in your browser.

## Project Structure

```
admin/
├── src/
│   ├── app/
│   │   ├── (protected)/    # Authenticated admin pages (dashboard, content, users, analytics, leaderboard, notifications)
│   │   └── login/          # Login page
│   ├── components/         # UI components, charts, layout
│   ├── lib/                 # API clients / utilities
│   ├── providers/           # App-level context providers
│   ├── store/                # Zustand stores
│   └── types/                # TypeScript types
└── public/
```

## Scripts

```bash
npm run dev     # Start development server
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Lint the project
```

## Deployment

The `Dockerfile` in this directory builds a production image. See the root [docker-compose.yml](../docker-compose.yml) for running it alongside the backend and MongoDB.

The backend API this dashboard talks to is documented in [../backend/README.md](../backend/README.md).
