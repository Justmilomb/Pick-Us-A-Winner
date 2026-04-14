# ARCHITECTURE.md — Giveaway Engine

## System Graph

```
                          ┌─────────────────────────────────────────┐
                          │              Browser (Client)           │
                          │  React 19 + Vite + TailwindCSS          │
                          │  Wouter routing / React Query state     │
                          └──────────────────┬──────────────────────┘
                                             │ HTTP /api/*
                          ┌──────────────────▼──────────────────────┐
                          │           Express 5 Server              │
                          │  port 5000 (dev + prod)                 │
                          │                                         │
                          │  Middleware chain:                      │
                          │  Rate Limiter → IP Block Check →        │
                          │  Request Validation → Route Handler     │
                          │                                         │
                          │  ┌─────────────┐  ┌──────────────────┐ │
                          │  │  routes.ts  │  │  scheduler.ts    │ │
                          │  │ (all API)   │  │  (polls 60s)     │ │
                          │  └──────┬──────┘  └────────┬─────────┘ │
                          │         │                   │           │
                          │  ┌──────▼──────┐  ┌────────▼─────────┐ │
                          │  │ instagram.ts│  │   storage.ts     │ │
                          │  │  (dispatch) │  │ MemStorage/PG    │ │
                          │  └──────┬──────┘  └──────────────────┘ │
                          └─────────┼───────────────────────────────┘
                                    │
               ┌────────────────────┼──────────────────────┐
               │                    │                      │
   ┌───────────▼──────────┐  ┌──────▼──────────┐  ┌───────▼──────────────┐
   │  WebSocket Relay     │  │  PostgreSQL 16   │  │  SMTP (Nodemailer)   │
   │  (local Pi worker)   │  │  Drizzle ORM     │  │  winner emails       │
   └───────────┬──────────┘  └─────────────────┘  └──────────────────────┘
               │
   ┌───────────▼──────────┐  ┌──────────────────────────────────────────┐
   │  Raspberry Pi /      │  │  Stripe                                  │
   │  local machine       │  │  PaymentIntent API + Elements            │
   │  Puppeteer scraper   │  └──────────────────────────────────────────┘
   └──────────────────────┘
```

## Subsystem Responsibilities

| Subsystem | Files | Responsibility |
|---|---|---|
| Frontend App | `client/src/` | React SPA — giveaway UI, payment flow, auth pages, analytics |
| API Layer | `server/routes.ts` | All HTTP endpoints, input validation, response shaping |
| Auth | `server/auth.ts` | Passport.js local strategy, session management, registration |
| Security | `server/security.ts` | Rate limiting, IP blocking, credit system (2 free / IP), admin auth |
| Instagram Dispatch | `server/instagram.ts` | Strategy selection: WebSocket relay or local Puppeteer |
| Scraper (Puppeteer) | `server/scraper/` | Instagram login, comment fetching via network interception + DOM fallback |
| Scraper Relay | `server/scraper-relay.ts` | WebSocket server bridging remote workers (e.g. Raspberry Pi) |
| Scheduler | `server/scheduler.ts` | Background job loop — polls every 60s, runs pending giveaways |
| Storage | `server/storage.ts` | MemStorage (Map + JSON file) or PostgreSQL via Drizzle |
| Email | `server/email.ts`, `server/email-templates.ts` | Nodemailer SMTP config, winner notification templates |
| Payments | `server/routes.ts` (payment routes) | Stripe PaymentIntent creation and confirmation, token issuance |
| Shared Schema | `shared/schema.ts` | Drizzle table definitions + Zod validation schemas for both sides |
| Build | `script/build.ts` | Vite (client → `dist/public/`) + esbuild (server → `dist/index.cjs`) |

## Data Flow — Giveaway Run

```
User submits Instagram URL
  → POST /api/instagram/comments (consumes 1 credit)
    → instagram.ts selects strategy
      → WebSocket relay (preferred) OR local Puppeteer scraper
        → returns comment list
  → Client filters comments (keyword, mention, duplicate rules)
  → Client selects N random winners
  → Optional: POST /api/giveaways (saves + schedules)
    → scheduler.ts picks up pending job
      → re-fetches comments, picks winners, sends email via email.ts
```

## Storage Strategy

- Default: `MemStorage` — Map-based, persists to `db.json` on write
- Production: PostgreSQL 16 — activated when `DATABASE_URL` is set
- Schema migrations: `drizzle-kit push` (no migration files in prod flow)
