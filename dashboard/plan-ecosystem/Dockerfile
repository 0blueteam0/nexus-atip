# Plan Ecosystem Dashboard Docker Image
# Node.js 20 Alpine for minimal size

FROM node:20-alpine

LABEL maintainer="Claude Code"
LABEL description="Plan Ecosystem Dashboard - Plans and implementation status monitoring"

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY server.js ./
COPY collectors/ ./collectors/
COPY public/ ./public/
COPY plugins/ ./plugins/

# Environment variables
ENV NODE_ENV=production
ENV BASE_PATH=/data
ENV PORT=7847

# Expose port
EXPOSE 7847

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:7847/api/stats || exit 1

# Run as non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Start server
CMD ["node", "server.js"]
