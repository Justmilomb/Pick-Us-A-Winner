# Directory Structure — Giveaway Engine

```
client/src/
  pages/              # Route page components (tool, analytics, schedule, auth, home, etc.)
  components/         # Reusable UI (ui/ has shadcn components)
  hooks/              # Custom hooks (use-user, use-toast, use-mobile)
  lib/                # Utilities (queryClient, protected-route, utils, stripe)
  App.tsx             # Root component with Wouter routes
  main.tsx            # React entry point

server/
  index.ts            # Server entry point — Express, HTTP server, scheduler
  routes.ts           # All API endpoints (~400 lines)
  auth.ts             # Passport.js local strategy, registration, session config
  security.ts         # Rate limiters, credit system, IP blocking, admin auth
  instagram.ts        # Instagram scraper dispatch (relay + custom Puppeteer)
  scheduler.ts        # Background job processor (polls every 60s)
  storage.ts          # In-memory storage with JSON file persistence fallback
  email.ts            # Nodemailer SMTP config
  email-templates.ts  # HTML/text email templates
  image.ts            # Image processing (sharp)
  scraper/            # Custom Instagram scraper module
    instagram-scraper.ts      # Main scraper class
    session-manager.ts        # Login automation & cookie persistence
    proxy-manager.ts          # Proxy rotation
    instagram-api-client.ts   # Instagram API utilities

shared/
  schema.ts           # Drizzle ORM schema + Zod validation schemas

script/
  build.ts            # Production build (Vite + esbuild)
  manual-login.ts     # Instagram login automation
  debug-api.ts        # API endpoint debugging

migrations/           # Drizzle-kit database migrations
docs/                 # Project documentation
```
