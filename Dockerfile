# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:22-alpine

# Build stage
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

# Trust optional corp SSL-inspection CA bundle during build (apk, npm, next/font).
# certs/ is gitignored; bundle is empty/absent on machines without an MITM proxy.
COPY certs/ /tmp/corp-certs/
RUN mkdir -p /etc/ssl/corp && \
    if ls /tmp/corp-certs/*.pem >/dev/null 2>&1; then \
      cat /tmp/corp-certs/*.pem > /etc/ssl/corp/bundle.pem && \
      cat /tmp/corp-certs/*.pem >> /etc/ssl/cert.pem; \
    else \
      : > /etc/ssl/corp/bundle.pem; \
    fi && \
    rm -rf /tmp/corp-certs
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/corp/bundle.pem

# Install OpenSSL for Prisma detection
RUN apk add --no-cache openssl

# Copy package files (.npmrc silences update-notifier during npm ci)
COPY package.json package-lock.json* .npmrc* ./
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
COPY --from=builder --chown=nextjs:nodejs /app/scripts/ensure-status-changed-at.js ./scripts/ensure-status-changed-at.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts/ensure-search-index.js ./scripts/ensure-search-index.js

USER nextjs

EXPOSE 4444

ENV PORT=4444
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q --spider "http://127.0.0.1:${PORT}/" || exit 1

CMD ["sh", "-c", "node scripts/ensure-status-changed-at.js && node scripts/ensure-search-index.js && node server.js"]
