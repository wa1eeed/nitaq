# ─── Stage 1: install dependencies ────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-utils/package.json packages/shared-utils/
COPY apps/api/package.json apps/api/
COPY apps/web/admin/package.json apps/web/admin/
COPY apps/web/client/package.json apps/web/client/
COPY apps/web/provider/package.json apps/web/provider/
COPY apps/web/landing/package.json apps/web/landing/

RUN pnpm install --frozen-lockfile=false

# ─── Stage 2: build ────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@9 --activate

# Reuse installed deps from stage 1 (node_modules excluded from COPY . . via .dockerignore)
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages/shared-utils/node_modules ./packages/shared-utils/node_modules
COPY --from=deps /repo/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /repo/apps/web/admin/node_modules ./apps/web/admin/node_modules
COPY . .

# Build shared-utils CJS dist (required as module entry point)
RUN pnpm --filter @naqla/shared-utils run build

# Next.js standalone build (output: 'standalone' in next.config.mjs)
RUN pnpm --filter @naqla/admin run build

# ─── Stage 3: production runner ────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget \
 && addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

# Standalone output mirrors the monorepo path (apps/web/admin/server.js)
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/admin/.next/static      ./apps/web/admin/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/admin/public             ./apps/web/admin/public

USER nextjs
WORKDIR /app/apps/web/admin
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO /dev/null http://localhost:3001/ || exit 1

CMD ["node", "server.js"]
