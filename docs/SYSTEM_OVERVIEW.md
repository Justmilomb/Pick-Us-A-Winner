# System Overview — Giveaway Engine

## What It Does

Instagram giveaway runner (PickUsAWinner Engine). Users create giveaways linked to Instagram posts, the system scrapes comments, applies filtering rules, and selects random winners. Supports scheduled giveaways, payment processing, and email notifications.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, TailwindCSS 4, shadcn/ui |
| Backend | Express 5, Node.js |
| Database | PostgreSQL 16, Drizzle ORM |
| Scraping | Puppeteer + stealth plugin |
| Payments | Stripe (PaymentIntent API) |
| Email | Nodemailer (SMTP) |
| Auth | Passport.js (local strategy) |

## Runtime Lifecycle

1. Express server starts, loads middleware and routes
2. Vite dev server attaches (development) or static files served (production)
3. Scheduler polls every 60s for pending/scheduled giveaways
4. User creates giveaway → scraper fetches comments → filters applied → winners selected
5. Payment processed via Stripe → email notifications sent

## Key Constraints

- Instagram scraping depends on session cookies and proxy rotation
- Puppeteer requires Chromium (heavy dependency)
- No automated tests — manual testing only
- In-memory storage with JSON file fallback (not for high-traffic production)
