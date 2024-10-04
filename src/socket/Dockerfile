# Build stage
FROM node:16-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:16-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy built files from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Expose port 3001
EXPOSE 3001

# Set command to run server
CMD ["node", "dist/server.js"]

# Add metadata labels
LABEL maintainer="Pollen8 Development Team"
LABEL description="WebSocket service for the Pollen8 platform"
LABEL version="1.0"

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Create a non-root user and switch to it
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Use a multi-stage build for a smaller final image
# This Dockerfile addresses the following requirements:
# - Containerization (Technical Specification/6.3 Containerization)
# - Scalable Architecture (Technical Specification/2.2 High-Level Architecture Diagram)
# - Minimalist Design (Technical Specification/1.1 System Objectives)
# - Production Readiness (Technical Specification/6.3.2 Container Specifications)