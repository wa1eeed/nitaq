FROM node:20-alpine
WORKDIR /repo

RUN apk add --no-cache openssl tini \
 && corepack enable && corepack prepare pnpm@9 --activate

# ── Layer 1: manifests (cached until any package.json changes) ────────────────
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-utils/package.json packages/shared-utils/
COPY apps/api/package.json apps/api/
COPY apps/web/admin/package.json apps/web/admin/
COPY apps/web/client/package.json apps/web/client/
COPY apps/web/provider/package.json apps/web/provider/
COPY apps/web/landing/package.json apps/web/landing/

# Force development so pnpm installs devDeps regardless of Coolify's NODE_ENV.
ENV NODE_ENV=development
RUN pnpm install --frozen-lockfile=false

# ── Layer 2: source + build ────────────────────────────────────────────────────
COPY . .
RUN pnpm --filter @naqla/shared-utils run build
RUN pnpm --filter @naqla/api run db:generate && pnpm --filter @naqla/api run build
RUN cd /repo/apps/api && ../../node_modules/.bin/tsc \
  --target ES2020 --module commonjs --esModuleInterop --skipLibCheck \
  --resolveJsonModule --outDir dist/prisma prisma/seed.ts

# ── Runtime config ─────────────────────────────────────────────────────────────
# Single-stage: the Prisma binary was already generated for linux-musl-openssl-3.0.x
# (same Alpine base) during db:generate above, so no extra prisma generate needed.
ENV NODE_ENV=production
WORKDIR /repo/apps/api

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO /dev/null http://localhost:4000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
# prisma bin lives in apps/api/node_modules/.bin (pnpm per-package bin scope).
# WORKDIR is /repo/apps/api so node_modules/.bin/prisma resolves correctly.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/src/main.js"]
