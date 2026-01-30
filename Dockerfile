# STAGE 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (Force fresh install, ignore lockfile issues)
# We delete package-lock logic effectively by not copying it or ignoring it
RUN npm install --legacy-peer-deps --no-audit

# Copy source code
COPY . .

# Build the project
RUN npm run build

# STAGE 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

USER appuser

EXPOSE 5000

CMD ["npm", "run", "start"]
