# PickUsAWinner Engine

Live on Render.
Version: 1.0.2

## Quick Start

```bash
npm install
npm run dev                    # Start backend + frontend dev server
npm run scraper:worker        # Start local Instagram scraper worker (separate terminal)
npm run build                 # Production build
npm run start                 # Run production build
```

## Project Structure

```
├── client/                    # React frontend application
│   ├── src/
│   │   ├── pages/            # Route components (home, tool, analytics, etc.)
│   │   ├── components/       # Reusable UI components (ui/ has shadcn)
│   │   ├── hooks/            # Custom React hooks (auth, toast, etc.)
│   │   ├── lib/              # Utilities (stripe, queryClient, etc.)
│   │   └── assets/           # Images and static assets
│   └── public/               # Static files served as-is
│
├── server/                    # Express backend application
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # All API endpoints
│   ├── instagram.ts          # Instagram scraping logic
│   ├── auth.ts               # Passport authentication
│   ├── security.ts           # Rate limiting, IP blocking, credits
│   ├── scheduler.ts          # Background job processor
│   ├── storage.ts            # In-memory + JSON persistence
│   ├── email.ts              # Email configuration
│   ├── email-templates.ts    # HTML email templates
│   ├── image.ts              # Image processing (sharp)
│   ├── log.ts                # Logging utility
│   ├── scraper/              # Instagram scraper module
│   │   ├── instagram-scraper.ts        # Main Puppeteer scraper
│   │   ├── session-manager.ts          # Login automation
│   │   ├── proxy-manager.ts            # Proxy rotation
│   │   ├── instagram-api-client.ts     # API utilities
│   │   ├── test-scraper.ts             # Manual testing
│   │   └── README.md                   # Scraper documentation
│   └── scraper-relay.ts      # WebSocket relay for local workers
│
├── shared/                    # Code shared between client and server
│   └── schema.ts             # Database schema + Zod validation
│
├── script/                    # Build and utility scripts
│   ├── build.ts              # Production build orchestration
│   ├── manual-login.ts       # Instagram login automation
│   └── debug-api.ts          # API endpoint testing
│
├── migrations/               # Drizzle database migrations
├── CLAUDE.md                 # Architecture documentation
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## Code Maintenance Standards

### Folder Organization

Each folder contains specific, related code:
- **client/src/pages/** — One file per route (tool.tsx, home.tsx, etc.)
- **client/src/components/** — Reusable UI components, organized by purpose
- **client/src/lib/** — Utilities, helpers, and configuration
- **server/** — All backend logic at root level or in focused subfolders
- **server/scraper/** — Only Instagram scraping logic; don't add other features here
- **shared/** — Only code used by both client and server

### File Naming

- **Pages/Components:** PascalCase, `.tsx` extension (e.g., `GiveawayTool.tsx`)
- **Utilities:** camelCase, `.ts` extension (e.g., `stripe.ts`)
- **Types/Schemas:** Define in the same file or in `schema.ts` if shared
- **Tests:** Suffix with `.test.ts` or `.spec.ts`

### Code Style

- **TypeScript:** Strict mode enabled. No `any` unless unavoidable.
- **Imports:** Use path aliases (`@/`, `@shared/`) in client code; relative imports in server
- **Functions:** Export named functions for tree-shaking; prefer small, focused functions
- **Comments:** Add comments only when logic is non-obvious. Avoid redundant comments.
- **Formatting:** 2-space indentation, semicolons required, no trailing commas in function args

### Component Structure

React components follow this pattern:

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onSubmit: (data: string) => void;
}

export default function MyComponent({ onSubmit }: Props) {
  const [state, setState] = useState("");

  const handleClick = () => {
    onSubmit(state);
  };

  return <Button onClick={handleClick}>Submit</Button>;
}
```

### API Routes

All endpoints under `/api` with global middleware:
1. Rate limiting
2. IP block checking
3. Request validation
4. Route-specific logic

Return JSON responses with `message` or `error` fields. Use HTTP status codes correctly:
- `200`: Success
- `402`: Payment required (credits exhausted)
- `400`: Bad request
- `401`: Unauthorized
- `404`: Not found
- `500`: Server error

### Error Handling

- **Client:** Use `useToast()` hook to show errors
- **Server:** Throw or pass errors to middleware; global handler returns JSON
- **Database:** Catch transaction errors; don't let constraints fail silently

## Key Features

### Authentication

- **Passport.js** local strategy with session storage
- Users can register with email/password or use guest mode
- Sessions stored in memory (or PostgreSQL if `DATABASE_URL` set)

### Credit System

- **2 free credits** per IP address per day
- **Payment tokens** unlock additional fetches
- In-memory tracking; resets if server restarts

### Instagram Scraping

1. **Strategy 1:** WebSocket relay to local worker (highest priority)
2. **Strategy 2:** Custom Puppeteer scraper with credentials
3. Error if neither available

### Scheduled Giveaways

- `scheduler.ts` runs every 60 seconds
- Polls database for pending giveaways
- Fetches comments, filters, picks winners, sends email
- Stateless design — can run on multiple servers

### Email

- Sent via Nodemailer SMTP
- Templates in `email-templates.ts` (HTML + plain text)
- Used for scheduled giveaway results

## Environment Variables

Create a `.env` file (see `.env.example`):

```
DATABASE_URL=postgresql://...          # PostgreSQL (optional)
INSTAGRAM_USERNAME=...                 # For Puppeteer scraper
INSTAGRAM_PASSWORD=...                 # For Puppeteer scraper
SMTP_HOST=...                          # Email SMTP
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
ADMIN_API_KEY=...                      # Admin endpoints
STRIPE_SECRET_KEY=...                  # Payments
STRIPE_PUBLISHABLE_KEY=...
PORT=5000                              # Server port
```

## Database

Using **Drizzle ORM** with PostgreSQL (optional). Schema in `shared/schema.ts`:
- **users** — id, firstName, username, email, password, createdAt
- **giveaways** — id, userId, scheduledFor, status, config, winners, accessToken, createdAt

Run migrations: `npm run db:push`

## Testing

No automated test framework. Manual testing:
- `npm run test-scraper` — Test Instagram scraper
- `npm run check` — TypeScript type checking

## Deployment

Build: `npm run build` → outputs to `dist/`
- Client: `dist/public/` (served by Express)
- Server: `dist/index.cjs` (CommonJS bundle)

Docker available; set `NODE_ENV=production` and ensure `.env` is configured.

## SEO (Bing/Edge)

For better visibility on Bing and Microsoft Edge search:
1. Submit your sitemap at [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Sitemap URL: `https://pickusawinner.com/sitemap.xml`
3. Verify your domain and monitor indexing status

## Common Tasks

### Add a new API endpoint

1. Define route in `server/routes.ts`
2. Add validation schema (Zod) in `shared/schema.ts` if needed
3. Implement handler logic
4. Return JSON with `message` or `error`

### Add a new page

1. Create component in `client/src/pages/YourPage.tsx`
2. Add route in `client/src/App.tsx`
3. Import and use in root layout

### Modify the scraper

1. Edit `server/scraper/instagram-scraper.ts`
2. Test with `npm run test-scraper`
3. Check logs in `server/log.ts` for debugging

### Debug an issue

1. Check `server/log.ts` output
2. Add `log()` calls in problematic code
3. Use `npm run dev` to see server logs in real-time
4. Check browser console (`F12`) for client errors
