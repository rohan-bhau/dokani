# Multi-stage Dockerfile for Dokani Frontend Web Application
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@12.5.1 --activate
WORKDIR /app

# Stage 1: Build dependencies and Next.js standalone application
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY app/package.json ./app/

RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY app ./app

RUN pnpm --filter @dokani/shared build
RUN pnpm --filter @dokani/app build

# Stage 2: Production Slim Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Security: unprivileged system user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy standalone build artifact and static assets
COPY --from=builder --chown=nextjs:nodejs /app/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/app/.next/static ./app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/app/public ./app/public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "app/server.js"]
