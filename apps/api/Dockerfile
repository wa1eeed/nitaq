FROM node:20-alpine AS builder
WORKDIR /repo
ENV NODE_ENV=development
RUN apk add --no-cache openssl \
 && corepack enable && corepack prepare pnpm@9 --activate

# Layer 1 — manifests only (cached until any package.json changes)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-utils/package.json packages/shared-utils/
COPY apps/api/package.json apps/api/
COPY apps/web/admin/package.json apps/web/admin/
COPY apps/web/client/package.json apps/web/client/
COPY apps/web/provider/package.json apps/web/provider/
COPY apps/web/landing/package.json apps/web/landing/
RUN pnpm install --frozen-lockfile=false

# Layer 2 — source
COPY . .
RUN pnpm --filter @naqla/shared-utils run build
RUN pnpm --filter @naqla/api run db:generate && pnpm --filter @naqla/api run build
RUN cd /repo/apps/api && node_modules/.bin/tsc \
  --target ES2020 --module commonjs --esModuleInterop --skipLibCheck \
  --resolveJsonModule --outDir dist/prisma prisma/seed.ts

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
RUN apk add --no-cache openssl tini

# Copy the entire pnpm virtual store from the builder so all packages and
# their hard-linked binaries are present without running pnpm deploy again
# (pnpm deploy inside Docker is extremely slow due to cross-layer copy).
# We also copy workspace packages so the symlinks inside the virtual store
# (e.g. node_modules/.pnpm/.../@naqla/shared-utils → ../packages/shared-utils)
# resolve correctly at the same absolute paths.
COPY --from=builder /repo/node_modules /repo/node_modules
COPY --from=builder /repo/packages/shared-types /repo/packages/shared-types
COPY --from=builder /repo/packages/shared-utils /repo/packages/shared-utils
COPY --from=builder /repo/apps/api/dist /repo/apps/api/dist
COPY --from=builder /repo/apps/api/package.json /repo/apps/api/package.json
COPY --from=builder /repo/apps/api/prisma /repo/apps/api/prisma

# Run from the API package directory so prisma can find prisma/schema.prisma
# and dist/src/main.js without extra path arguments.
WORKDIR /repo/apps/api

# Regenerate Prisma client inside the runtime container so the
# linux-musl-openssl-3.0.x query-engine binary is built for THIS environment.
RUN node ../../node_modules/.bin/prisma generate

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO /dev/null http://localhost:4000/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
# Apply any pending DB migrations (idempotent) then start the API server.
CMD ["sh", "-c", "node ../../node_modules/.bin/prisma migrate deploy && node dist/src/main.js"]
