# Multi-stage build for AI ThreadStash Backend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install OS deps for building (if needed)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all deps for building
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install runtime deps (curl for healthcheck, dumb-init for signal handling)
RUN apk add --no-cache curl dumb-init

# Install PM2 globally
RUN npm install -g pm2

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nestjs -u 1001

# Copy only necessary files
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Install only production deps
RUN npm ci --only=production && npm cache clean --force

# Copy PM2 ecosystem file
COPY --chown=nestjs:nodejs ecosystem.config.js ./

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3007

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:3007/health || exit 1

# Start application with PM2 via dumb-init for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["pm2-runtime", "start", "ecosystem.config.js"]