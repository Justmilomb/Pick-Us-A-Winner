# Maintainability Backlog

Prioritized technical debt and organization tasks for cleaner long-term ownership.

## P0 (Do Soon)

1. Break up `server/routes.ts` by feature domain.
- Reason: current file is hard to review and easy to regress.
- Target: `server/routes/*.ts` + top-level composition function.

2. Define DTO types for high-traffic `any` paths.
- Files: `server/routes.ts`, `server/scheduler.ts`, `server/scraper/*.ts`
- Reason: improve static safety and editor assistance.

3. Centralize response helpers for consistent error shapes.
- Reason: currently mixed patterns (`error`, `message`, plain strings).

## P1 (Next)

1. Add request schema modules.
- File targets: each route domain module.
- Reason: keep validation co-located and reusable.

2. Add API smoke tests.
- Focus endpoints:
  - Auth (`/api/register`, `/api/login`, `/api/user`)
  - Payment (`/api/payment/confirm`)
  - Giveaways (`POST/GET/PUT/DELETE /api/giveaways*`)
  - Admin auth gates

3. Reduce direct `console.*` calls in server files.
- Use `server/log.ts` consistently for structured logging.

## P2 (Later)

1. Move release and audit docs into a `docs/` directory with index links.
2. Add lint rules for:
- no-explicit-any (allow scoped exceptions)
- no hardcoded credentials/secrets
- max file length warning for route modules
3. Add architecture decision records for major behavior choices (token-based public giveaway management, storage strategy).

## Naming and Folder Hygiene Rules

1. Keep route files feature-scoped.
2. Keep shared types in `shared/` or `server/types/`.
3. Keep one purpose per file; avoid utility dumping.
4. Keep docs current with behavior changes in the same PR.
