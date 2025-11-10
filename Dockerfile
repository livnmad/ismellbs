# Multi-stage build for backend
FROM node:20-alpine AS server-builder

WORKDIR /app

# Set npm timeout and registry
ENV NPM_CONFIG_FETCH_TIMEOUT=300000
ENV NPM_CONFIG_FETCH_RETRIES=5
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000

# Copy root package files
COPY package*.json ./
COPY tsconfig.server.json ./

# Install all dependencies with progress tracking
RUN npm ci --loglevel=info --prefer-offline --no-audit

# Copy server source
COPY server ./server

# Build TypeScript
RUN npm run build:server

# Multi-stage build for frontend
FROM node:20-alpine AS client-builder

WORKDIR /app

# Set npm timeout and registry
ENV NPM_CONFIG_FETCH_TIMEOUT=300000
ENV NPM_CONFIG_FETCH_RETRIES=5
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000

# Copy client package files
COPY client/package*.json ./client/
WORKDIR /app/client

# Install dependencies with progress tracking
RUN npm ci --loglevel=info --prefer-offline --no-audit

# Copy client source
COPY client ./
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Set npm timeout and registry
ENV NPM_CONFIG_FETCH_TIMEOUT=300000

# Copy root package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --loglevel=info --prefer-offline --no-audit

# Copy built server from builder
COPY --from=server-builder /app/dist ./dist

# Copy built client from builder
COPY --from=client-builder /app/client/build ./client/build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
