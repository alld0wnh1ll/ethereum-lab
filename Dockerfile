# Ethereum Immersive Trainer - Docker Image
# Supports two modes: instructor (full blockchain node) and student (frontend only)

# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
# Note: We use a dynamic base path so it works in both modes
RUN npm run build

# ============================================
# Stage 2: Production Image
# ============================================
FROM node:20-alpine

LABEL maintainer="Ethereum Immersive Trainer"
LABEL description="Interactive blockchain training environment"

WORKDIR /app

# Install curl for health checks and serve for static files
RUN apk add --no-cache curl bash

# Copy blockchain dependencies (needed for instructor mode)
COPY package*.json ./
RUN npm ci --only=production

# Copy blockchain contracts and scripts
COPY contracts/ ./contracts/
COPY scripts/ ./scripts/
COPY hardhat.config.js ./

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Install serve for static file hosting
RUN npm install -g serve

# Create directories for runtime data
RUN mkdir -p /app/data

# Copy startup scripts
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Environment variables
ENV MODE=instructor
ENV RPC_PORT=8545
ENV FRONTEND_PORT=5173
ENV CONTRACT_ADDRESS=""
ENV INSTRUCTOR_RPC_URL=""

# Expose ports
EXPOSE 8545 5173

# Health check - checks frontend availability
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${FRONTEND_PORT}/ || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
