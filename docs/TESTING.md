# Testing — Giveaway Engine

## Current State

**No automated test framework configured.** This is a known gap.

## Available Checks

```bash
npm run check          # TypeScript compiler (tsc --noEmit)
npm run test-scraper   # Manual scraper test
```

## Smoke Test Checklist

- [ ] `npm run dev` starts without errors
- [ ] Home page loads at localhost:5000
- [ ] User registration and login work
- [ ] Creating a new giveaway works
- [ ] Instagram post URL parsing works
- [ ] Comment scraping initiates (check logs)
- [ ] Winner selection completes
- [ ] Stripe payment flow completes (test mode)
- [ ] Email notifications send (check logs)
- [ ] Scheduled giveaway triggers on time
