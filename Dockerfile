# Multi-stage Dockerfile for Profilytics

# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Build the backend
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --legacy-peer-deps --only=production
RUN npx prisma generate

# Stage 3: Production runtime
FROM node:18-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built frontend
COPY --from=frontend-builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=frontend-builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=frontend-builder --chown=nextjs:nodejs /app/public ./public

# Copy backend
COPY --from=backend-builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend ./backend
COPY --from=backend-builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy startup script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000 5000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ENTRYPOINT ["dumb-init", "--"]
CMD ["./docker-entrypoint.sh"] 