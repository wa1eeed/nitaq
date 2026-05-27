FROM node:20-alpine AS builder
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy ALL workspace manifests so pnpm install sees the full workspace.
# Without this, COPY . . later introduces packages pnpm never installed,
# which confuses pnpm deploy.
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
# Compile seed.ts → dist/prisma/seed.js so it can run with plain node in production
RUN cd /repo/apps/api && node_modules/.bin/tsc \
  --target ES2020 --module commonjs --esModuleInterop --skipLibCheck \
  --resolveJsonModule --outDir dist/prisma prisma/seed.ts

# pnpm deploy produces flat node_modules (no pnpm store symlinks)
RUN pnpm --filter @naqla/api deploy --prod /prod

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl tini
COPY --from=builder /prod/node_modules ./node_modules
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/apps/api/package.json ./
COPY --from=builder /repo/apps/api/prisma ./prisma
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO /dev/null http://localhost:4000/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/src/main.js"]
