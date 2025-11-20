# Multi-stage Dockerfile for Ethereum Lab
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Blockchain Node + Frontend Server
FROM node:20-alpine

WORKDIR /app

# Install dependencies for blockchain
COPY package*.json ./
RUN npm ci --only=production

# Copy blockchain contracts and scripts
COPY contracts/ ./contracts/
COPY scripts/ ./scripts/
COPY hardhat.config.js ./

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Install a simple static file server for frontend
RUN npm install -g serve

# Expose ports
EXPOSE 8545 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8545', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Copy startup script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]

