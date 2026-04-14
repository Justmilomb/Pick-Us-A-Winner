# Coding Standards — Giveaway Engine

## TypeScript

- **Strict mode** enabled. All source files use `.ts` / `.tsx`.
- **ES modules** (`"type": "module"` in package.json). Server builds to CJS for production.
- **No `any`**, no `@ts-ignore`.

## Imports

- Use path aliases (`@/`, `@shared/`) from client code, not relative paths.
- Server code uses relative imports.

## Validation

- Zod schemas for all input validation.
- Derive from Drizzle schema where possible.

## Components

- shadcn/ui pattern — copy-paste components in `client/src/components/ui/`, customised locally.
- React Hook Form for form state.

## Styling

- TailwindCSS utility classes. No separate CSS modules or styled-components.

## API

- Express 5 route handlers in `server/routes.ts`.
- All endpoints return JSON.
- Error responses use consistent format.

## Database

- Drizzle ORM with PostgreSQL.
- Schema in `shared/schema.ts`.
- Migrations via `drizzle-kit push`.
