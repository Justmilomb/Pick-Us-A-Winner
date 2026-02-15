# Code Organization & Maintainability Guide

This document explains the project structure, file placement rules, and how to maintain code quality as the project grows.

## Folder Organization Rules

### Root Level
```
giveaway-engine/
├── client/              # All frontend code (React app)
├── server/              # All backend code (Express app)
├── shared/              # Code used by BOTH client and server
├── script/              # Build and utility scripts
├── migrations/          # Database migrations (Drizzle)
├── node_modules/        # Dependencies (auto-generated)
├── dist/                # Production build output (auto-generated)
├── .env                 # Environment variables (local only, not committed)
├── package.json         # Dependencies list
├── tsconfig.json        # TypeScript configuration
├── CLAUDE.md            # Architecture documentation
├── README.md            # Quick start and overview
├── CODE_ORGANIZATION.md # This file
└── RELEASE_CHECKLIST.md # Pre-release verification
```

**Rule:** Never add new top-level directories without updating `CLAUDE.md` and this file.

### Client Structure (`client/src/`)

```
client/src/
├── pages/                   # One file per route
│   ├── home.tsx            # Landing page
│   ├── tool.tsx            # Giveaway picker (main feature)
│   ├── analytics.tsx       # Statistics
│   ├── schedule.tsx        # Scheduled results view
│   └── ...                 # Other pages (auth, terms, etc.)
│
├── components/
│   ├── ui/                 # shadcn/ui components (Radix-based)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── slider.tsx
│   │   ├── switch.tsx
│   │   └── ...
│   ├── layout.tsx          # Main layout wrapper
│   ├── seo.tsx             # SEO/meta tags component
│   ├── AdBanner.tsx        # Google AdSense placement
│   ├── checkout-form.tsx   # Stripe payment form
│   ├── winner-card.tsx     # Winner display card
│   └── ...                 # Other reusable components
│
├── hooks/
│   ├── use-user.ts         # Auth context hook
│   ├── use-toast.ts        # Toast notification hook
│   └── use-mobile.ts       # Mobile detection hook
│
├── lib/
│   ├── stripe.ts           # Stripe.js initialization
│   ├── queryClient.ts      # React Query setup
│   ├── utils.ts            # General utility functions
│   └── protected-route.tsx # Auth wrapper component
│
├── assets/
│   └── hero-giveaway.png   # Hero image
│
├── App.tsx                 # Root component with routes
├── main.tsx                # React entry point
└── index.css               # Global styles + Tailwind
```

**Rules:**
- **Pages:** One component per route. Name matches the route path (e.g., `/tool` → `tool.tsx`).
- **Components:** Reusable UI components. Create `components/Foo/index.tsx` if complex.
- **Hooks:** Custom React hooks only. Follow `use*` naming convention.
- **Lib:** Utilities, configurations, helpers. No React components.
- **No subdirectories in pages:** Keep pages flat unless organizing by feature.

### Server Structure (`server/`)

```
server/
├── index.ts                      # Entry point (setup, middleware, scheduler)
├── routes.ts                     # All API endpoints (grouped by feature)
├── auth.ts                       # Passport.js strategy, registration
├── security.ts                   # Rate limiting, IP blocking, credits
├── instagram.ts                  # Instagram scraping orchestration
├── scheduler.ts                  # Background job processor
├── storage.ts                    # In-memory storage + JSON persistence
├── email.ts                      # Nodemailer SMTP config
├── email-templates.ts            # HTML/text email templates
├── image.ts                      # Image processing (sharp)
├── log.ts                        # Logging utility
├── scraper-relay.ts              # WebSocket relay for local workers
├── vite.ts                       # Vite dev server setup (dev only)
├── static.ts                     # Static file serving (production)
│
└── scraper/                      # Instagram scraping module ONLY
    ├── instagram-scraper.ts      # Main Puppeteer scraper
    ├── session-manager.ts        # Login automation
    ├── proxy-manager.ts          # Proxy rotation
    ├── instagram-api-client.ts   # Instagram API utilities
    ├── test-scraper.ts           # Manual testing script
    └── README.md                 # Scraper-specific docs
```

**Rules:**
- **Root level files:** Only files directly related to server initialization or middleware.
- **scraper/ folder:** ONLY Instagram scraping logic. Don't add other features here.
- **Use route modules:** Add endpoints in `server/routes/<feature>.ts` and compose via `server/routes.ts`.
- **Feature grouping:** Group related logic in single files (e.g., `auth.ts` for all auth).

### Shared Structure (`shared/`)

```
shared/
└── schema.ts              # Drizzle database schema + Zod validation
```

**Rule:** Only code used by BOTH client and server goes here. Most validation schemas live here.

### Scripts Structure (`script/`)

```
script/
├── build.ts              # Production build (client + server)
├── manual-login.ts       # Instagram login automation
├── debug-api.ts          # API endpoint testing
└── README.md             # Script documentation
```

**Rule:** Build and utility scripts only. No application logic here.

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| React component | PascalCase | `GiveawayTool.tsx`, `AdBanner.tsx` |
| Page component | PascalCase, matches route | `home.tsx` → `<Home>` |
| Utility/helper | camelCase | `queryClient.ts`, `stripe.ts` |
| Hooks | camelCase, `use*` prefix | `useUser.ts`, `useToast.ts` |
| Types/interfaces | PascalCase | `Props`, `User`, `GiveawayConfig` |
| Constants | UPPER_SNAKE_CASE | `MAX_WINNERS`, `API_TIMEOUT` |
| Database tables | Lowercase plural | `users`, `giveaways` |

## Code Placement Decision Tree

**Does the code exist in both client AND server?**
- YES → `shared/schema.ts` or `shared/` subdirectory
- NO → Continue below

**Is it frontend React code?**
- Component (UI element) → `client/src/components/`
- Page (route) → `client/src/pages/`
- Hook (custom hook) → `client/src/hooks/`
- Utility (helper) → `client/src/lib/`
- Asset (image) → `client/src/assets/`
- NO → Continue below

**Is it backend Express code?**
- API endpoint → `server/routes/<feature>.ts`
- Authentication → `server/auth.ts`
- Security/rate limiting → `server/security.ts`
- Instagram scraping → `server/scraper/`
- Email logic → `server/email.ts` or `server/email-templates.ts`
- Database query → `server/routes/<feature>.ts` (keep with endpoint)
- Background job → `server/scheduler.ts`
- Utility → `server/` (new file if large)
- NO → Continue below

**Is it a script (build, test, utility)?**
- YES → `script/`
- NO → Doesn't belong in project

## Maintaining Code Quality

### When Adding a New Feature

1. **Check folder structure** — Does it fit an existing folder?
2. **No new top-level folders** — Add to existing structure
3. **One responsibility** — File should have clear, single purpose
4. **Follow naming** — Use conventions above
5. **Add documentation** — Update relevant README
6. **Test locally** — `npm run check` (TypeScript) and manual testing
7. **Update CLAUDE.md** — If architecture changes

### When Moving/Removing Code

1. **Never delete files** — Archive or leave them (per user instructions)
2. **Update imports** — Don't break other files
3. **Check CLAUDE.md** — Update documentation
4. **Run TypeScript check** — `npm run check`

### Code Review Checklist

Before committing:
- [ ] TypeScript compiles: `npm run check`
- [ ] No console.log or debugger statements
- [ ] Error handling implemented
- [ ] Input validation (Zod on server, React Hook Form on client)
- [ ] No hardcoded secrets or credentials
- [ ] Following project conventions
- [ ] Documentation updated (if needed)

## Common Mistakes to Avoid

❌ **Don't:**
- Create new top-level folders without discussion
- Add business logic to component files (separate concerns)
- Mix different features in same file
- Put non-scraping code in `server/scraper/`
- Hardcode API URLs or credentials
- Leave console.log in production code
- Ignore TypeScript errors

✅ **Do:**
- Keep components focused and small
- Extract logic to utilities/hooks
- Follow naming conventions
- Update documentation
- Run TypeScript check
- Organize by feature, not by type
- Keep files under 400 lines (consider splitting)

## File Size Guidelines

- **Components:** < 300 lines
- **Pages:** < 400 lines
- **Utilities:** < 200 lines
- **Routes file:** Can be larger (currently ~22KB, acceptable)
- **Scraper:** Can be larger (~41KB, feature-heavy)

If a file exceeds these, consider:
1. Extracting helpers to separate utility files
2. Breaking component into smaller pieces
3. Moving logic to hooks/context

## Documentation Requirements

Each folder should have:
- **README.md** — Overview, structure, conventions
- **CLAUDE.md** — Architecture (root level only)
- **Code comments** — Explain non-obvious logic only

Files don't need inline comments if they're self-documenting (good naming + clear code).

## Testing & Verification

- **TypeScript:** `npm run check`
- **Build:** `npm run build`
- **Dev server:** `npm run dev`
- **Scraper:** `npm run test-scraper`
- **Manual testing:** Use `script/debug-api.ts` for API endpoints

## Summary

**The project is organized by:**
- **Location** — Client, server, shared, or scripts
- **Feature** — Related functionality grouped together
- **Clarity** — File names and structure immediately obvious

**This enables:**
- Easy navigation for new developers
- Clear separation of concerns
- Simple maintenance and updates
- Scalability as features grow
- Consistency across the codebase

**Keep it simple and organized. When in doubt, follow existing patterns.**
