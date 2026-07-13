# ─── Admin Panel Dockerfile ───
FROM node:20-alpine AS base
WORKDIR /app

# Install deps
FROM base AS deps
# Explicitly set npm platform to musl so optional deps resolve correctly on Alpine
ENV npm_config_platform=linux
ENV npm_config_libc=musl
# Copy root package files for monorepo
COPY package*.json ./
COPY admin/package.json ./admin/
# Strip root package.json to only reference admin workspace —
# other workspace dirs (backend, frontend, etc.) are not present in this
# Docker context and cause npm to mis-hoist dependencies.
RUN node -e " \
  const pkg = require('./package.json'); \
  pkg.workspaces = ['admin']; \
  require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));"
RUN npm install --workspace=admin --include=optional && \
    npm install --save-optional \
      lightningcss-linux-x64-musl \
      @tailwindcss/oxide-linux-x64-musl \
      tailwindcss@4 \
      @next/swc-linux-x64-musl@16.1.6

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY admin/ ./admin/
WORKDIR /app/admin
ENV NEXT_TELEMETRY_DISABLED=1
ENV npm_config_platform=linux
ENV npm_config_libc=musl
# Ensure admin can resolve packages from root node_modules
RUN if [ ! -d "node_modules" ]; then ln -s /app/node_modules ./node_modules; fi
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app/admin
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public directory from source (not included in standalone build)
COPY --from=builder /app/admin/public ./public
# Copy from the monorepo-aware standalone build structure
COPY --from=builder --chown=nextjs:nodejs /app/admin/.next/standalone/admin/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/admin/.next/standalone/admin/server.js ./server.js
COPY --from=builder --chown=nextjs:nodejs /app/admin/.next/standalone/admin/package.json ./package.json
COPY --from=builder /app/admin/.next/standalone/node_modules ../node_modules

# Copy static assets (CSS, JS chunks)
COPY --from=builder --chown=nextjs:nodejs /app/admin/.next/static ./.next/static

USER nextjs
EXPOSE 3001
ENV PORT=3001
CMD ["node", "server.js"]
