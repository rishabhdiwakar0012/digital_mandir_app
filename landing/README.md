# Digital Mandir — Landing Site

Public marketing website for Digital Mandir, including the privacy policy and account-deletion request pages, built with Next.js 16 and Tailwind CSS.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/) for animations

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
landing/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home page
│   │   ├── privacy-policy/       # Privacy policy page
│   │   └── delete-account/       # Account deletion request page
│   └── lib/                       # Utilities
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

The `Dockerfile` in this directory builds a production image suitable for deployment behind any Node-compatible host (Vercel, Docker, etc.).
