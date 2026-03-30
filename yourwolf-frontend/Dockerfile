# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install a simple static file server (pinned to major version for reproducibility)
RUN npm install -g serve@14

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy serve configuration
COPY --from=builder /app/serve.json ./dist/serve.json

# Expose port
EXPOSE 3000

# Start the server
CMD ["serve", "-s", "dist", "-l", "3000", "--config", "dist/serve.json"]
