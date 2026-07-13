# ─── Backend Dockerfile ───
FROM node:20-alpine AS base
WORKDIR /app

# Install deps
FROM base AS deps
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/
COPY package*.json ./
RUN npm ci --workspace=backend --workspace=shared --ignore-scripts

# Build shared first, then backend
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY shared/ ./shared/
COPY backend/ ./backend/
COPY package*.json ./
RUN cd shared && npm run build 2>/dev/null || true
RUN cd backend && npm run build

# Production
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./package.json
COPY backend/firebase-google.json ./firebase-google.json

EXPOSE 3000
CMD ["node", "dist/main.js"]
