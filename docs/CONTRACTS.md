# CONTRACTS.md — Interface Contracts

Defines what each subsystem boundary expects, returns, and guarantees.

---

## 1. Client ↔ Server (HTTP API)

All routes are under `/api`. Global middleware applies rate limiting and IP block checks before every handler.

| Endpoint | Method | Auth Required | Request Shape | Response Shape | Invariants |
|---|---|---|---|---|---|
| `/api/register` | POST | No | `{ firstName, email, password }` | `{ id, firstName, email }` | Email must be unique; password hashed with scrypt |
| `/api/login` | POST | No | `{ email, password }` | User object | Sets session cookie |
| `/api/logout` | POST | Yes | — | `{ ok: true }` | Destroys session |
| `/api/user` | GET | Yes | — | User object | Returns 401 if no session |
| `/api/credits` | GET | No | — | `{ credits: number }` | IP-based; 2 free credits per IP |
| `/api/credits/redeem` | POST | No | `{ token: string }` | `{ credits: number }` | Token must be a valid payment token |
| `/api/config` | GET | No | — | `{ publishableKey: string }` | Returns Stripe publishable key |
| `/api/payment/create-intent` | POST | No | `{ amount: number }` | `{ clientSecret: string }` | Creates Stripe PaymentIntent server-side |
| `/api/payment/confirm` | POST | No | `{ paymentIntentId: string }` | `{ token: string }` | Verifies payment succeeded; issues redeemable token |
| `/api/instagram/validate` | POST | No | `{ url: string }` | `{ valid: boolean }` | Validates Instagram post URL format |
| `/api/instagram/comments` | POST | No | `{ url: string }` | `{ comments: Comment[] }` | Consumes 1 credit; returns 402 if credits exhausted |
| `/api/giveaways` | POST | Yes | `{ scheduledFor, config }` | Giveaway object | `userId` derived from session (never trusted from client) |
| `/api/giveaways` | GET | Yes | — | `Giveaway[]` | Returns only the authenticated user's giveaways |
| `/api/giveaways/:token` | GET | No | — | Giveaway object | Public access via UUID token |
| `/api/giveaways/:id` | PUT | Yes | Partial giveaway fields | Updated giveaway | Must own the giveaway |
| `/api/giveaways/:id` | DELETE | Yes | — | `{ ok: true }` | Must own the giveaway |
| `/api/analytics` | GET | Admin | — | Stats object | Requires `ADMIN_API_KEY` header |
| `/api/admin/generate-token` | POST | Admin | `{ credits: number }` | `{ token: string }` | Credits bounded 1–100 |
| `/api/admin/security` | GET | Admin | — | Security stats | Requires `ADMIN_API_KEY` header |
| `/api/admin/email/health` | GET | Admin | — | SMTP health status | SMTP verify result |

---

## 2. Server ↔ Instagram Scraper

**File:** `server/instagram.ts` dispatches to one of two strategies.

### Strategy A — WebSocket Relay
- **When:** A local worker (e.g. Raspberry Pi) is connected via WebSocket
- **Call:** `instagram.ts` sends a JSON message over the relay socket with `{ url }`
- **Returns:** `{ comments: Array<{ username, text, timestamp }> }`
- **Invariants:** Worker must be running `server/scraper/test-scraper.ts` or equivalent; relay managed by `server/scraper-relay.ts`

### Strategy B — Local Puppeteer Scraper
- **When:** No relay worker connected; `INSTAGRAM_USERNAME` / `INSTAGRAM_PASSWORD` set
- **Call:** `instagram-scraper.ts` launches Puppeteer with stealth plugin
- **Returns:** `Comment[]` via network interception (primary) or DOM parsing (fallback)
- **Invariants:** Instagram session cookies persisted by `session-manager.ts`; proxy rotation via `proxy-manager.ts` if configured

### Error Handling
- If neither strategy is available: returns `503` with message `"No scraper available. Start the local worker..."`

---

## 3. Server ↔ Stripe

**Files:** `server/routes.ts` (payment routes), `client/src/lib/stripe.ts`

| Call | When | What It Returns | Invariants |
|---|---|---|---|
| `stripe.paymentIntents.create()` | `POST /api/payment/create-intent` | `{ client_secret }` | `STRIPE_SECRET_KEY` must be set; amount in pence/cents |
| `stripe.paymentIntents.retrieve()` | `POST /api/payment/confirm` | PaymentIntent object | Checks `status === 'succeeded'` before issuing token |
| `loadStripe()` (client) | On checkout mount | Stripe.js instance | Uses `STRIPE_PUBLISHABLE_KEY` fetched from `/api/config` |

**Invariants:** Stripe secret key never sent to client. Publishable key served via `/api/config` only.

---

## 4. Server ↔ Email (Nodemailer)

**Files:** `server/email.ts`, `server/email-templates.ts`

| Call | When | What It Returns | Invariants |
|---|---|---|---|
| `transporter.verify()` | Server startup | SMTP health result | Logs warning if SMTP not configured |
| `sendWinnerEmail()` | Scheduler completes a giveaway | `{ messageId }` | Requires `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| Admin health check | `GET /api/admin/email/health` | SMTP connection status | Uses `transporter.verify()` on demand |

**Retry behavior:** If `SMTP_FROM` is rejected, retries with `SMTP_USER` as sender.

---

## 5. Scheduler ↔ Storage

**Files:** `server/scheduler.ts`, `server/storage.ts`

| Call | When | What It Returns | Invariants |
|---|---|---|---|
| `storage.getPendingGiveaways()` | Every 60 seconds | `Giveaway[]` with `status = 'pending'` and `scheduledFor <= now` | Polls indefinitely |
| `storage.updateGiveaway(id, { status, winners })` | After processing | Updated giveaway | Status set to `'completed'` or `'failed'` |
| `storage.getUserById(userId)` | During processing | User object | Needed to send winner email to the giveaway owner |

**Processing flow per job:**
1. Fetch Instagram comments via `instagram.ts`
2. Apply filtering rules from `giveaway.config`
3. Select random winners
4. Call `sendWinnerEmail()`
5. Update giveaway status to `'completed'`; on any error, set to `'failed'`
