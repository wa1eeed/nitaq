FROM node:20-alpine AS builder
WORKDIR /repo
# Force development mode so pnpm installs devDependencies even if the
# deployment platform injects NODE_ENV=production/staging.
ENV NODE_ENV=development
# openssl is required so `prisma generate` can detect the correct
# openssl-3.0.x target and download the matching query-engine binary.
RUN apk add --no-cache openssl \
 && corepack enable && corepack prepare pnpm@9 --activate

# Copy ALL workspace manifests so pnpm install sees the full workspace.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-utils/package.json packages/shared-utils/
COPY apps/api/package.json apps/api/
COPY apps/web/admin/package.json apps/web/admin/
COPY apps/web/client/package.json apps/web/client/
COPY apps/web/provider/package.json apps/web/provider/
COPY apps/web/landing/package.json apps/web/landing/
RUN pnpm install --frozen-lockfile=false

COPY . .
RUN pnpm --filter @naqla/shared-utils run build
RUN pnpm --filter @naqla/api run db:generate && pnpm --filter @naqla/api run build
# Compile seed.ts → dist/prisma/seed.js so it can run with plain node
RUN cd /repo/apps/api && node_modules/.bin/tsc \
  --target ES2020 --module commonjs --esModuleInterop --skipLibCheck \
  --resolveJsonModule --outDir dist/prisma prisma/seed.ts

RUN pnpm --filter @naqla/api deploy --prod /prod

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl tini
COPY --from=builder /prod/node_modules ./node_modules
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/apps/api/package.json ./
COPY --from=builder /repo/apps/api/prisma ./prisma
# Generate Prisma client in the exact runtime environment so the correct
# linux-musl-openssl-3.0.x binary ends up in the right node_modules path.
RUN node ./node_modules/.bin/prisma generate --schema ./prisma/schema.prisma
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO /dev/null http://localhost:4000/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
# Run pending migrations before starting the app so the DB schema is always
# in sync with the codebase — safe to run on every restart (idempotent).
CMD ["sh", "-c", "node ./node_modules/.bin/prisma migrate deploy && node dist/src/main.js"]
