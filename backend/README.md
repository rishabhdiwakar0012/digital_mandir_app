<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Digital Mandir — Backend API

Core REST API for Digital Mandir, built with [NestJS](https://nestjs.com) and MongoDB.

## Features

- **Auth** — email/phone + Google Sign-In, JWT access/refresh tokens, throttling
- **Jaap** — mantra chanting session tracking
- **Users** — profiles, streaks, levels
- **Content** — deities, mantras, festivals, sections (used by the admin dashboard)
- **Devices** — device registration for push notifications
- **Notifications** — Firebase Cloud Messaging integration, automated/scheduled notifications
- **Analytics** — usage metrics for the admin dashboard
- **Upload** — S3-backed media uploads
- **i18n** — multi-language API responses
- **Health** — health-check endpoint for uptime monitoring

## Tech Stack

- [NestJS 11](https://nestjs.com) (TypeScript)
- [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- [Passport](https://www.passportjs.org/) (JWT + local strategies)
- [Zod](https://zod.dev) via `nestjs-zod` for validation
- [Swagger](https://docs.nestjs.com/openapi/introduction) for API documentation
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) for push notifications
- [AWS S3 SDK](https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html) for uploads

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `MONGODB_URI`, `JWT_SECRET`, Google OAuth credentials, Firebase credentials, and (optionally) SMS/email provider credentials. See the comments in `.env.example` for where to obtain each value.

### 3. Run MongoDB

Use a local instance, or run it via the root [docker-compose.yml](../docker-compose.yml):

```bash
docker-compose up -d mongodb
```

### 4. Run the API

```bash
# development (watch mode)
npm run start:dev

# production mode
npm run start:prod
```

The API is available at `http://localhost:3000/api` by default, with Swagger docs at `/api/docs` (if enabled).

## Project Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── analytics/       # Usage analytics
│   │   ├── content/          # Deities, mantras, festivals, sections
│   │   ├── devices/           # Device registration for push
│   │   ├── health/             # Health check
│   │   ├── jaap/                # Mantra jaap sessions
│   │   ├── notifications/        # FCM + automated notifications
│   │   ├── upload/                # S3 media uploads
│   │   ├── user/                   # User profile/streaks
│   │   └── users/                   # User administration
│   ├── common/               # Shared decorators, guards, filters, pipes
│   ├── config/                # App configuration
│   ├── core/                   # Core providers/auth
│   ├── i18n/                    # Translation files
│   ├── app.module.ts
│   └── main.ts
└── test/                      # e2e tests
```

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# integration tests
npm run test:integration

# coverage
npm run test:cov

# all tests
npm run test:all
```

## Deployment

The `Dockerfile` in this directory builds a production image. See the root [docker-compose.yml](../docker-compose.yml) for running it alongside MongoDB and the admin dashboard.

## License

Proprietary — all rights reserved.
