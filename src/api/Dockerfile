# Stage 1: Builder
FROM node:16-alpine AS builder

# Set working directory
WORKDIR /app

# Set environment variable
ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Production
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Set environment variable
ENV NODE_ENV=production

# Set non-root user
USER node

# Copy built artifacts from builder stage
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json

# Expose port
EXPOSE 3000

# Set up health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Configure startup command
CMD ["node", "dist/index.js"]

# Set resource limits
# Note: These are typically set at the container runtime level, not in the Dockerfile
# But we'll add comments to indicate the requirements
# CPU: 1.0
# Memory: 1GB