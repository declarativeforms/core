# API source standards

## Purpose

`src` contains the API's runtime entrypoints, HTTP presentation layer, and core
application code.

## Architecture

- `main.ts` loads environment variables and starts or clusters the HTTP process.
- `server.ts` constructs Fastify, installs cross-cutting HTTP behavior, handles
  unexpected failures, and registers routes.
- `scheduler.ts` is an independent worker entrypoint with graceful shutdown.
- Feature behavior belongs below `routes` or `core`; entrypoints only compose and
  start the process.
- Preserve `routes -> core -> services -> repositories/gateways/strategies`.

## Naming

- Entrypoint filenames describe their process role and remain unsuffixed.
- Module constants use `SCREAMING_SNAKE_CASE`; locals use camelCase.
- Use `startX` or `main` only for actual process entry operations.

## Coding standards

- Load `dotenv` only in `main.ts` and `scheduler.ts`.
- Keep signal handling and process exit behavior in entrypoints.
- Keep HTTP concerns in `server.ts` and `routes`; never leak `reply`, headers, or
  status codes into `core`.
- Register substantial routes from `routes`; do not add another inline route to
  `server.ts`.
- Apply the package rules for explicit return types, comments, imports,
  configuration, and formatting.

## Verification

- Build both the API and the root TypeScript project.
- Confirm both HTTP and scheduler entrypoints still resolve the same container.
- Confirm no feature logic or shared type was added directly under `src`.
