# Project Review (2026-02-14)

This review focuses on:
- Server-side validation and trust boundaries
- User verification and auth behavior
- Code maintainability and onboarding quality
- Repository structure clarity

## Scope Reviewed

- `server/` (API routes, auth, security, storage, scheduler, email)
- `client/src/` (contact flow, route/layout organization, common patterns)
- `shared/schema.ts`
- Root docs and project layout

## High-Impact Findings

1. Client-controlled `userId` in giveaway creation could be trusted by server.
2. Giveaway creation input shape/date/url checks were too permissive.
3. Payment confirmation logs exposed generated payment token values.
4. Google OAuth used hardcoded fallback credentials in code.
5. Contact form UX and API behavior were inconsistent with temporary email disablement.

## Fixes Applied

1. `server/routes.ts`
- Giveaway creation now derives `userId` from session only.
- Added validation for `scheduledFor` date shape.
- Added validation for `config` object and `config.url`.
- Removed payment token value from payment verification log.
- Added bounds check on `/api/admin/generate-token` credits (`1..100`).

2. `server/auth.ts`
- Removed hardcoded Google OAuth fallback client ID/secret.
- Google OAuth routes now return `503` when OAuth env vars are missing.
- Added startup warning when Google OAuth is disabled.

3. `client/src/pages/contact.tsx` and `server/routes.ts`
- Contact page is visually greyed out and disabled.
- Backend `/api/contact` returns direct-email guidance (`503`) consistently.

4. Email reliability and diagnostics (already completed in this session)
- SMTP verify-once and timeout hardening.
- Retry with `SMTP_USER` when `SMTP_FROM` is rejected by provider.
- Added admin SMTP health endpoint: `GET /api/admin/email/health`.

## Maintainability Notes

- `server/routes.ts` is currently monolithic and should be split by domain.
- `any` usage is still widespread in scraper and route mapping code.
- Root contains many release/debug artifacts that should be grouped under a `docs/` strategy over time.

## Recommended Next Refactor Wave

1. Split `server/routes.ts` into:
- `server/routes/payment.ts`
- `server/routes/giveaways.ts`
- `server/routes/admin.ts`
- `server/routes/ads.ts`

2. Introduce request schemas (Zod) per endpoint module and parse once at boundary.

3. Replace high-frequency `any` usage with narrow DTO types for:
- Instagram comment payload shape
- Giveaway config shape
- Analytics response aggregates

4. Add lightweight API smoke tests for:
- Auth/register/login
- Payment confirm/token redemption
- Giveaway create/update/delete by token
- Admin auth-protected endpoints

## Verification

- TypeScript check passes: `npm.cmd run check`.
