FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies (vite and plugin-react needed for preview)
RUN pnpm install --frozen-lockfile --prod=false

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/vite.config.ts ./
COPY --from=builder /app/package.json ./

# Add node_modules/.bin to PATH
ENV PATH="/app/node_modules/.bin:$PATH"

# Expose port (will be overridden by PORT env var)
EXPOSE 5173

# Start vite preview server
CMD ["sh", "-c", "vite preview --host 0.0.0.0 --port ${PORT:-5173}"]

