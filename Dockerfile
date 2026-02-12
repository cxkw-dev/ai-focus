# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:22-alpine

# Build stage
FROM ${NODE_IMAGE} AS builder

# Install OpenSSL for Prisma detection
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --no-audit --no-fund

# Copy source
COPY . .

# Generate Prisma client
RUN DATABASE_URL="postgresql://postgres@localhost:5432/aifocus" \
  npx prisma generate --config prisma/prisma.config.ts

# Build the application
RUN npm run build

# Production stage
FROM ${NODE_IMAGE} AS runner

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 4444

ENV PORT=4444
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q --spider "http://127.0.0.1:${PORT}/" || exit 1

CMD ["node", "server.js"]
