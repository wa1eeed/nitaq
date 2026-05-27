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

# pnpm deploy produces a virtual-store node_modules in /prod but omits
# the generated .prisma/client directory (query engine + JS).
RUN pnpm --filter @naqla/api deploy --prod /prod

# Manually copy the generated .prisma/client (with the binary) into the
# exact same virtual-store path inside /prod/node_modules so that
# `COPY /prod/node_modules` in the runtime stage brings it along.
RUN cp -r \
  /repo/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma \
  /prod/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl tini
# /prod/node_modules now includes .prisma/client with the query-engine binary.
COPY --from=builder /prod/node_modules ./node_modules
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/apps/api/package.json ./
COPY --from=builder /repo/apps/api/prisma ./prisma
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO /dev/null http://localhost:4000/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/src/main.js"]
