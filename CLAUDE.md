# CLAUDE.md — Giveaway Engine

## Project Overview

Full-stack Instagram giveaway runner (PickUsAWinner Engine). Scrapes comments from Instagram posts, applies filtering rules, and selects random winners. Built with TypeScript across client and server with shared schema definitions.

## Tech Stack

- **Frontend:** React 19, Vite 7, TailwindCSS 4, shadcn/ui (Radix), Wouter (routing), React Query, React Hook Form + Zod
- **Backend:** Express 5, Passport.js (local strategy), express-session, express-rate-limit
- **Database:** PostgreSQL 16, Drizzle ORM, drizzle-kit (migrations)
- **Scraping:** Puppeteer + puppeteer-extra-plugin-stealth
- **Payments:** Stripe (PaymentIntent API + Stripe Elements)
- **Email:** Nodemailer (SMTP)
- **Build:** Vite (client), esbuild (server), tsx (dev runner)

## Repository Structure

```
client/src/           # React frontend
  pages/              # Route page components (tool, analytics, schedule, auth, home, etc.)
  components/         # Reusable UI (ui/ has shadcn components)
  hooks/              # Custom hooks (use-user, use-toast, use-mobile)
  lib/                # Utilities (queryClient, protected-route, utils, stripe)
  App.tsx             # Root component with Wouter routes
  main.tsx            # React entry point

server/               # Express backend
  index.ts            # Server entry point — sets up Express, HTTP server, scheduler
  routes.ts           # All API endpoints (~400 lines)
  auth.ts             # Passport.js local strategy, registration, session config
  security.ts         # Rate limiters, credit system, IP blocking, admin auth
  instagram.ts        # Instagram scraper dispatch (relay + custom Puppeteer)
  scheduler.ts        # Background job processor (polls every 60s for pending giveaways)
  storage.ts          # In-memory storage with JSON file persistence fallback
  email.ts            # Nodemailer SMTP config and sending
  email-templates.ts  # HTML/text email templates
  image.ts            # Image processing (sharp)
  log.ts              # Logging utility
  vite.ts             # Vite dev server middleware setup
  static.ts           # Production static file serving
  scraper/            # Custom Instagram scraper module
    instagram-scraper.ts      # Main scraper class (Puppeteer, network interception, DOM fallback)
    session-manager.ts        # Login automation & cookie persistence
    proxy-manager.ts          # Proxy rotation
    instagram-api-client.ts   # Instagram API utilities
    test-scraper.ts           # Manual scraper testing

shared/               # Shared between client and server
  schema.ts           # Drizzle ORM schema (users, giveaways) + Zod validation schemas

script/               # Build and utility scripts
  build.ts            # Production build (Vite + esbuild)
  manual-login.ts     # Instagram login automation
  debug-api.ts        # API endpoint debugging

migrations/           # Drizzle-kit database migrations
```

## Commands

```bash
# Development
npm run dev              # Start backend dev server (tsx, port 5000)
npm run dev:client       # Start frontend dev server only (Vite, port 5000)

# Build & Production
npm run build            # Build client (Vite → dist/public) and server (esbuild → dist/index.cjs)
npm run start            # Run production build (node dist/index.cjs)

# Type Checking
npm run check            # Run TypeScript compiler (tsc --noEmit)

# Database
npm run db:push          # Push schema changes to database (drizzle-kit push)

# Utilities
npm run instagram:login  # Manual Instagram login automation
npm run test-scraper     # Test the custom Instagram scraper
```

## Path Aliases

Configured in `tsconfig.json` and `vite.config.ts`:

- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets` → `./attached_assets` (Vite only)

## Database Schema

Defined in `shared/schema.ts` using Drizzle ORM:

- **users** — id (UUID), firstName, username (optional, unique), email (unique), password (hashed with scrypt), createdAt
- **giveaways** — id (UUID), userId (FK → users), scheduledFor, status (pending/completed/failed), config (JSONB), winners (JSONB), accessToken (unique UUID for sharing), createdAt

Zod insert schemas (`insertUserSchema`, `insertGiveawaySchema`) are auto-derived from Drizzle schema via `drizzle-zod`.

## API Routes

All under `/api` with global rate limiting, block checking, and request validation middleware.

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/register` | POST | No | Create user account |
| `/api/login` | POST | No | Authenticate (Passport local) |
| `/api/logout` | POST | Yes | End session |
| `/api/user` | GET | Yes | Get current user |
| `/api/credits` | GET | No | Check remaining credits (IP-based) |
| `/api/credits/redeem` | POST | No | Redeem payment token |
| `/api/config` | GET | No | Stripe publishable key for frontend |
| `/api/payment/create-intent` | POST | No | Create Stripe PaymentIntent (returns clientSecret) |
| `/api/payment/confirm` | POST | No | Verify Stripe payment succeeded, issue purchase token |
| `/api/instagram/validate` | POST | No | Validate Instagram post URL |
| `/api/instagram/comments` | POST | No | Fetch comments (consumes credit) |
| `/api/giveaways` | POST | Yes | Create/schedule a giveaway |
| `/api/giveaways` | GET | Yes | List user's giveaways |
| `/api/giveaways/:token` | GET | No | Get giveaway by public access token |
| `/api/giveaways/:id` | PUT | Yes | Update a giveaway |
| `/api/giveaways/:id` | DELETE | Yes | Delete a giveaway |
| `/api/analytics` | GET | Admin | View stats |
| `/api/admin/generate-token` | POST | Admin | Generate payment token |
| `/api/admin/security` | GET | Admin | View security stats |

## Client Routes

Defined in `client/src/App.tsx` using Wouter:

- `/` — Home (landing page)
- `/tool` — Main giveaway tool UI
- `/analytics` — Giveaway statistics
- `/schedule/:token` — Scheduled giveaway page
- `/login`, `/register` — Authentication
- `/coming-soon`, `/privacy`, `/terms` — Static pages

## Architecture Patterns

- **Frontend state:** React Context for auth (`use-user`), React Query for server state, local state for UI
- **Component library:** shadcn/ui (New York style, Lucide icons) — components live in `client/src/components/ui/`
- **Backend middleware chain:** Global rate limiter → IP block check → request validation → route-specific limiters → handlers
- **Credit system:** IP-based, 2 free credits per IP, paid credits via token redemption. HTTP 402 when credits exhausted.
- **Storage:** `MemStorage` class (Map-based) with JSON persistence to `db.json`. PostgreSQL via Drizzle when `DATABASE_URL` is set.
- **Background jobs:** `scheduler.ts` polls every 60 seconds for pending giveaways, processes them (fetch comments, filter, pick winners, send emails)
- **Instagram scraping:** Custom Puppeteer scraper via WebSocket relay or local, with network interception and DOM fallback.

## Environment Variables

Required variables (see `.env.example`):

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | For DB | PostgreSQL connection string |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | For email | SMTP config for sending emails |
| `ADMIN_API_KEY` | For admin | Secret for admin endpoints |
| `SESSION_SECRET` | Production | Session encryption key |
| `INSTAGRAM_USERNAME`, `INSTAGRAM_PASSWORD` | For scraper | Credentials for custom Puppeteer scraper |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (server-side only) |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (served to frontend via /api/config) |
| `BASE_URL` | Optional | Domain for email links (auto-detected if not set) |
| `PORT` | Optional | Server port (default: 5000) |

## Build Details

- **Client build:** Vite outputs to `dist/public/`
- **Server build:** esbuild bundles `server/index.ts` into `dist/index.cjs` (CommonJS, minified). Bundled deps are allowlisted in `script/build.ts`; other deps are external.
- **Docker:** Node.js 20 Alpine, runs as non-root `appuser`, expects pre-built `dist/` folder, exposes port 5000.

---

## Reading Order (cold start)
1. Read `E:\Coding\Second Brain\Giveaway-Engine\CONTEXT.md` — your project brain
2. Read `E:\Coding\Second Brain\_index\MASTER_INDEX.md` — cross-project awareness
3. Read `E:\Coding\Second Brain\_index\SKILL_TRANSFERS.md` — applicable lessons
4. This file (`CLAUDE.md`) — project rules and architecture

---

## Coding Conventions

- **TypeScript strict mode** is enabled. All source files use `.ts` / `.tsx`.
- **ES modules** (`"type": "module"` in package.json). Server builds to CJS for production.
- **Imports:** Use path aliases (`@/`, `@shared/`) not relative paths from client code. Server code uses relative imports.
- **Validation:** Zod schemas for all input validation, derived from Drizzle schema where possible.
- **Components:** shadcn/ui pattern — copy-paste components in `client/src/components/ui/`, customized locally.
- **Styling:** TailwindCSS utility classes. No separate CSS modules or styled-components.
- **Forms:** React Hook Form with `@hookform/resolvers` for Zod integration.
- **Error handling:** Express error middleware in `server/index.ts` catches unhandled errors. Rate limiters and security middleware handle abuse.
- **Logging:** Custom `log()` function in `server/log.ts` for all server-side logging.

## Testing

No automated test framework is configured. Manual testing scripts exist:

- `npm run test-scraper` — Test the custom Instagram scraper
- `script/test-apify.ts` — Test Apify integration
- `script/debug-api.ts` — Debug API endpoints

Use `npm run check` (TypeScript compiler) as the primary correctness check.

## Key Files by Size/Complexity

These files contain the most logic and are most likely to need changes:

- `client/src/pages/tool.tsx` (68KB) — Main giveaway tool UI, comment fetching, filtering, winner selection
- `server/scraper/instagram-scraper.ts` (41KB) — Puppeteer-based Instagram scraper
- `server/routes.ts` (22KB) — All API endpoints
- `server/scraper/instagram-api-client.ts` (18KB) — Instagram API utilities
- `server/security.ts` (14KB) — Rate limiting, credit system, IP blocking
- `server/email-templates.ts` (13KB) — Email HTML/text templates
- `server/instagram.ts` (12KB) — Instagram integration (Apify + scraper dispatch)

---

## Before You Finish

### Minimum write-back (every session):
1. `E:\Coding\Second Brain\Giveaway-Engine\SESSION_LOG.md` — add entry if anything important happened
2. `E:\Coding\Second Brain\Giveaway-Engine\KNOWN_ISSUES.md` — add/remove bugs if any changed

### Full write-back (when project state materially changed):
3. `E:\Coding\Second Brain\Giveaway-Engine\CONTEXT.md` — update changed sections only
4. `E:\Coding\Second Brain\Giveaway-Engine\PATTERNS.md` — add if you learned something new
5. `E:\Coding\Second Brain\_index\MASTER_INDEX.md` — update if you added new knowledge files
6. `E:\Coding\Second Brain\_index\SKILL_TRANSFERS.md` — add if lesson applies elsewhere

### Notion database updates (use Notion MCP tools):

Database IDs are in `E:\Coding\Second Brain\_system\conventions\notion-config.md`.
Use `data_source_id` (not `database_id`) when creating pages via `notion-create-pages`.

7. **Projects database** — update status/health for Giveaway-Engine after significant work
8. **Tasks database** — update status of any tasks you worked on
9. **Bugs database** — add/update bugs found or fixed
10. **Agent Log** — add entry ONLY if important (decision, error, breakthrough, blocker)

If Notion MCP is unavailable, log pending updates to `E:\Coding\Second Brain\Giveaway-Engine\SESSION_LOG.md` with `[NOTION_PENDING]` tag.

### If session is interrupted:
Prioritise: SESSION_LOG > KNOWN_ISSUES > CONTEXT > everything else.
Notion updates are non-critical — Obsidian is the source of truth.
