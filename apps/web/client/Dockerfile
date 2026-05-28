FROM node:20-alpine
WORKDIR /repo

# Disable telemetry and force dev mode before anything else so pnpm
# installs devDependencies regardless of Coolify's NODE_ENV=staging.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=development

RUN apk add --no-cache wget \
 && corepack enable && corepack prepare pnpm@9 --activate \
 && addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# ── Layer 1: manifests (cached until any package.json changes) ────────────────
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-utils/package.json packages/shared-utils/
COPY apps/api/package.json apps/api/
COPY apps/web/admin/package.json apps/web/admin/
COPY apps/web/client/package.json apps/web/client/
COPY apps/web/provider/package.json apps/web/provider/
COPY apps/web/landing/package.json apps/web/landing/
RUN pnpm install --frozen-lockfile=false

# ── Layer 2: source + build ────────────────────────────────────────────────────
COPY . .
RUN pnpm --filter @naqla/shared-utils run build
RUN pnpm --filter @naqla/client run build

# ── Arrange standalone output into /app ───────────────────────────────────────
# Next.js standalone bundles a minimal server + node_modules in .next/standalone.
# We copy static assets and public dir into the standalone tree so server.js
# can serve them, then move the whole tree to /app and set permissions.
RUN cp -r apps/web/client/.next/static  apps/web/client/.next/standalone/apps/web/client/.next/static \
 && cp -r apps/web/client/public        apps/web/client/.next/standalone/apps/web/client/public \
 && mv     apps/web/client/.next/standalone /app \
 && chown -R nextjs:nodejs /app

ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME=0.0.0.0

USER nextjs
WORKDIR /app/apps/web/client
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO /dev/null http://localhost:3002/ || exit 1

CMD ["node", "server.js"]
