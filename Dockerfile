# STAGE 1: Builder
# We use a large image to build everything, then discard it to keep the final app small.
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (cached if package.json hasn't changed)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the project (Frontend + Backend)
RUN npm run build

# STAGE 2: Production Runner
# This is the actual server that will run online.
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Create a non-root user for security (Best Practice)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Switch to secure user
USER appuser

# Expose the port
EXPOSE 5000

# Start the engine
CMD ["npm", "run", "start"]
