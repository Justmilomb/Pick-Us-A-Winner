# Validation and Auth Matrix

This matrix captures the current server-side guardrails for key API surfaces.

## API Matrix

| Endpoint | Validation | Auth / Verification | Notes |
|---|---|---|---|
| `POST /api/register` | Required fields, email format, password min length | None (public) | Duplicate email check is present |
| `POST /api/login` | Email + password required | Passport local strategy | Returns explicit auth errors |
| `GET /api/user` | None | `req.isAuthenticated()` | Returns `401` when unauthenticated |
| `POST /api/payment/create-intent` | URL required + contains `instagram.com` | None (public) | Stripe intent metadata includes URL |
| `POST /api/payment/confirm` | `paymentIntentId` required | Stripe status verification + anti double-redeem | Token no longer logged |
| `POST /api/instagram/comments` | URL extraction + request validation middleware | Credit consumption or payment token redemption | Rate limited |
| `POST /api/instagram/check-followers` | `userIds` array required, limited to 20 | None | Rate limited |
| `POST /api/giveaways` | `scheduledFor`, `config`, `config.url`, contact email format, min/max schedule window | Payment token redemption; user identity derived from session | Does not trust body `userId` |
| `GET /api/giveaways` | None | `req.isAuthenticated()` | Returns empty list when unauthenticated |
| `GET /api/giveaways/:token` | Token length check | Access token possession | Public-by-token pattern |
| `PUT /api/giveaways/:token` | Lock window + schedule validation | Access token possession | Public-by-token pattern |
| `DELETE /api/giveaways/:token` | Lock window | Access token possession | Public-by-token pattern |
| `GET /api/analytics` | None | `adminAuthMiddleware` (`x-admin-key`) | Admin protected |
| `POST /api/admin/generate-token` | Credits parsed and bounded (`1..100`) | `adminAuthMiddleware` | Admin protected |
| `GET /api/admin/security` | None | `adminAuthMiddleware` | Admin protected |
| `GET /api/admin/email/health` | None | `adminAuthMiddleware` | No email sent, verify only |
| `POST /api/contact` | Disabled intentionally | N/A | Returns direct-email guidance |

## Known Gaps To Address Next

1. Add stricter schema validation for all admin ad endpoints (`/api/admin/ads*`).
2. Add explicit schema for giveaway `config` object fields (not just `url/contactEmail`).
3. Add test coverage for auth and token-based giveaway lifecycle.
4. Review whether follower-check endpoint should require purchase/auth to reduce abuse.
