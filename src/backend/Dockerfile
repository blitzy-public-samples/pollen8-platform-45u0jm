# Stage 1: Builder
FROM node:16-alpine AS builder

# Set working directory
WORKDIR /app

# Set environment variable for production
ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies using npm ci for consistent builds
RUN npm ci

# Copy source code and TypeScript config
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Production
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Set environment variable for production
ENV NODE_ENV=production

# Set non-root user for security
USER node

# Copy built artifacts from builder stage
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/package-lock.json ./package-lock.json

# Install only production dependencies
RUN npm ci --only=production

# Expose the backend service port
EXPOSE 3000

# Set up health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => res.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Configure startup command
CMD ["node", "dist/server.js"]

# Set resource limits
# Note: These are typically set at the container runtime level, not in the Dockerfile
# LABEL com.pollen8.resource.cpu="1.0"
# LABEL com.pollen8.resource.memory="1GB"