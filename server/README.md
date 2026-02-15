# Server — Express Backend

The backend is built with Express.js, handles all business logic, and coordinates with the database and external services (Stripe, email).

## Structure

```
server/
├── index.ts                    # Server entry point (sets up Express, HTTP, scheduler)
├── routes.ts                   # Route composition layer
├── routes/                     # Feature route modules
│   ├── payment.ts              # Stripe payment endpoints
│   ├── instagram.ts            # Instagram endpoints
│   ├── giveaways.ts            # Giveaway lifecycle endpoints
│   ├── admin.ts                # Admin + analytics endpoints
│   ├── ads.ts                  # Ads endpoints
│   └── public.ts               # Health/SEO/contact/public endpoints
├── auth.ts                     # Passport.js local strategy, registration, sessions
├── security.ts                 # Rate limiters, IP blocking, credit system
├── instagram.ts                # Instagram scraping orchestration (relay + custom scraper)
├── scheduler.ts                # Background job processor (runs every 60s)
├── storage.ts                  # In-memory storage + JSON persistence
├── email.ts                    # Nodemailer SMTP configuration
├── email-templates.ts          # HTML and plain-text email templates
├── image.ts                    # Image processing with sharp
├── log.ts                      # Logging utility
├── scraper-relay.ts            # WebSocket relay for local workers
├── vite.ts                     # Vite dev server setup
├── static.ts                   # Production static file serving
│
└── scraper/                    # Instagram scraper module (only scraping logic here)
    ├── instagram-scraper.ts    # Main Puppeteer-based scraper (41KB)
    ├── session-manager.ts      # Instagram login automation
    ├── proxy-manager.ts        # Proxy rotation
    ├── instagram-api-client.ts # Instagram GraphQL/REST API utilities (18KB)
    ├── test-scraper.ts         # Manual scraper testing script
    └── README.md               # Scraper-specific documentation
```

## Key Patterns

### API Endpoints

All routes follow this structure in `routes/<feature>.ts`:

```ts
app.post("/api/my-endpoint", async (req, res) => {
  try {
    // 1. Validate input
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: "Missing data" });

    // 2. Check auth if needed
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    // 3. Main logic
    const result = await doSomething(data);

    // 4. Return JSON
    return res.json({ message: "Success", result });
  } catch (error) {
    // Global error middleware handles this
    throw error;
  }
});
```

### Middleware

Global middleware runs in order:
1. **Express JSON parsing** — Parses `Content-Type: application/json`
2. **Request logging** — Logs all API calls with duration
3. **Rate limiting** — Global limits per IP
4. **IP blocking** — Blocks known bad actors
5. **Route-specific limits** — Additional limits for expensive operations
6. **Validation** — Zod schemas for request body/params
7. **Handler** — Your route logic
8. **Error handler** — Catches and returns JSON errors

### Database

Using **Drizzle ORM** (TypeScript-first, strongly typed).

Schema in `shared/schema.ts`:
```ts
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  password: text("password"),
  createdAt: timestamp("createdAt").defaultNow(),
});
```

Query example:
```ts
const user = await db.query.users.findFirst({
  where: eq(users.email, "user@example.com"),
});

const all = await db.query.users.findMany();

await db.insert(users).values({ email: "new@example.com", ... });
```

### Authentication

**Passport.js** local strategy:
```ts
// User registers with email + hashed password
// User logs in → Passport creates session
// Session stored in memory or database

app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  const hash = await scrypt(password, "salt", 64);
  await db.insert(users).values({ email, password: hash });
  res.json({ message: "Registered" });
});

app.post("/api/login", passport.authenticate("local"), (req, res) => {
  res.json({ message: "Logged in", user: req.user });
});
```

### Credit System

IP-based credit tracking in `security.ts`:
- **2 free credits** per IP per day
- **Payment tokens** unlock more fetches
- Each comment fetch costs 1 credit
- Returns `402 Payment Required` when exhausted

```ts
// In route handler
const credits = getCreditsForIP(req.ip);
if (credits < 1) {
  return res.status(402).json({ error: "No credits" });
}

// After using credit
consumeCredit(req.ip);
```

### Email Sending

Using **Nodemailer** with SMTP:

```ts
import { sendEmail } from "./email";

await sendEmail({
  to: "user@example.com",
  subject: "Your Giveaway Results",
  html: generateWinnerEmailHTML(winners),
  text: generateWinnerEmailText(winners),
});
```

Templates in `email-templates.ts` (HTML + plain text versions).

### Scheduled Jobs

`scheduler.ts` runs every 60 seconds:
```ts
setInterval(async () => {
  const pending = await db.query.giveaways.findMany({
    where: eq(giveaways.status, "pending"),
  });

  for (const giveaway of pending) {
    await processGiveaway(giveaway);
  }
}, 60000);
```

Stateless design — safe to run on multiple servers.

## Development

### Start Server

```bash
npm run dev                  # Start backend (watches for changes)
npm run scraper:worker      # In separate terminal, start local scraper
npm run build && npm start  # Production mode
```

### Logging

Use the `log()` function everywhere:
```ts
import { log } from "./log";

log("User registered", "info");
log("Database error: " + error.message, "error");
```

Check logs in `server/log.ts` file implementation.

### Debugging

```ts
// Add logs to problematic code
log(`Fetching comments for post: ${postId}`, "instagram");

// Check console output while dev server running
// npm run dev
```

### Environment Variables

Create `.env` (see `.env.example`):
```
DATABASE_URL=postgresql://user:pass@localhost/db
INSTAGRAM_USERNAME=your-ig-username
INSTAGRAM_PASSWORD=your-ig-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
ADMIN_API_KEY=your-admin-key
PORT=5000
```

## Key Files

### routes.ts
Thin composition file that registers all route modules.
- Auth: `/register`, `/login`, `/logout`, `/user`
- Giveaways: `/giveaways`, `/giveaways/:id`
- Instagram: `/instagram/comments`, `/instagram/validate`
- Payments: `/payment/create-intent`, `/payment/confirm`
- Admin: `/admin/*`

### instagram.ts (12KB)
Orchestrates scraping:
1. Try WebSocket relay (local worker)
2. Fall back to custom Puppeteer scraper
3. Error if neither available

### instagram-scraper.ts (41KB)
Main Puppeteer scraper:
- Login automation with cookies
- Network interception to capture API responses
- DOM parsing as fallback
- Handles Instagram rate limiting

### scheduler.ts (8KB)
Background job runner:
- Polls for pending giveaways every 60s
- Fetches comments, applies filters, picks winners
- Sends result emails
- Stateless (safe for horizontal scaling)

### security.ts (14KB)
Rate limiting and IP blocking:
- Global limit: 100 req/min per IP
- Expensive operations: 5 req/min per IP
- IP block list
- Credit system per IP

## Common Tasks

### Add a new API endpoint

1. Define route in `routes/<feature>.ts`:
   ```ts
   app.post("/api/my-feature", async (req, res) => {
     // ...
   });
   ```

2. Add validation in `shared/schema.ts` if needed:
   ```ts
   export const mySchema = z.object({
     field: z.string(),
   });
   ```

3. Use in endpoint:
   ```ts
   const data = mySchema.parse(req.body);
   ```

### Modify Instagram scraping

1. Edit `server/scraper/instagram-scraper.ts`
2. Test: `npm run test-scraper`
3. Check logs during development
4. Deploy and monitor

### Add a new database table

1. Define schema in `shared/schema.ts`
2. Generate migration: `npx drizzle-kit generate`
3. Push to database: `npm run db:push`
4. Query using Drizzle in routes

### Send an email

```ts
import { sendEmail } from "./email";

await sendEmail({
  to: "user@example.com",
  subject: "Welcome",
  html: "<h1>Hello!</h1>",
  text: "Hello!",
});
```

### Log something

```ts
import { log } from "./log";

log("Important message", "info");
log("Error occurred: " + error, "error");
log("Debug: " + JSON.stringify(obj), "debug");
```

## Performance

- **Database:** Use indexes for frequently queried fields
- **Email:** Send in background, don't block requests
- **Scraping:** Timeout after 30s, return partial results if needed
- **Rate limiting:** Set limits based on server capacity

## Security

- **Rate limiting:** Enabled globally and per operation
- **CSRF:** Sessions + same-origin only
- **Input validation:** Zod for all inputs
- **SQL injection:** Drizzle handles parameterized queries
- **Password hashing:** Scrypt with salt
- **Admin endpoints:** Require `ADMIN_API_KEY` header
