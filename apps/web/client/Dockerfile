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
COPY apps/web/carrier/package.json apps/web/carrier/
COPY apps/web/landing/package.json apps/web/landing/

RUN pnpm install --frozen-lockfile=false

# ─── Stage 2: build ────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages/shared-utils/node_modules ./packages/shared-utils/node_modules
COPY --from=deps /repo/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /repo/apps/web/client/node_modules ./apps/web/client/node_modules
COPY . .

RUN pnpm --filter @naqla/shared-utils run build
RUN pnpm --filter @naqla/client run build

# ─── Stage 3: production runner ────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget \
 && addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/client/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/client/.next/static      ./apps/web/client/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/client/public             ./apps/web/client/public

USER nextjs
WORKDIR /app/apps/web/client
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO /dev/null http://localhost:3002/ || exit 1

CMD ["node", "server.js"]
