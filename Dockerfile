# Multi-stage build for backend
FROM node:20-alpine AS server-builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.server.json ./

# Install all dependencies
RUN npm ci

# Copy server source
COPY server ./server

# Build TypeScript
RUN npm run build:server

# Multi-stage build for frontend
FROM node:20-alpine AS client-builder

WORKDIR /app

# Copy client package files
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm ci

# Copy client source
COPY client ./
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built server from builder
COPY --from=server-builder /app/dist ./dist

# Copy built client from builder
COPY --from=client-builder /app/client/build ./client/build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
