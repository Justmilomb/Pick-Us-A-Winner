FROM node:20-alpine

WORKDIR /app

# Copy package info
COPY package*.json ./

# Install ONLY production dependencies (super fast, no dev tools)
RUN npm install --omit=dev --legacy-peer-deps

# Copy the ALREADY BUILT app
COPY . .

# Install Chromium and dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Tell Puppeteer where to find Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Setup user
ENV NODE_ENV=production
ENV PORT=5000
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
