# API route standards

## Purpose

`routes` is the presentation and application boundary. A route validates the
HTTP request, establishes caller context, invokes domain services, and translates
their results into HTTP responses.

## Architecture

- Import exactly `getContainer` from `../core`; do not import service classes or
  infrastructure directly.
- Resolve the container inside the handler, never at module scope.
- Keep business rules and persistence out of handlers.
- Let domain errors reach the shared error handler; catch only when the route
  itself can recover.

## Naming

- A file lists URL segments in order, drops `/api/v1`, substitutes a generic
  name for parameters/wildcards, and ends with the HTTP method.
- Export the filename as a `SCREAMING_SNAKE_CASE` route constant.
- Handler locals use the domain-service method name without transport aliases.

## Coding standards

- Export a `RouteOptions<any, any, any, any>` object with keys in this order when
  present: `config`, `handler`, `method`, `preHandler`, `url`.
- Use an arrow handler and explicit `FastifyRequest` generics for body, params,
  and query values. Runtime-check every untrusted value.
- Guard query values with `typeof value === 'string'`; `qs` can produce objects
  that must never reach MongoDB filters.
- Authenticated routes opt in with `authenticate` or
  `[authenticate, authorizeOrganization]`. Public form/submission/file routes
  remain anonymous.
- After a guard response, send, leave a blank line, and `return`.
- Send resources directly without a general envelope. Keep user-facing localized
  prose in clients, not route error bodies.
- Use 404 for absent/invisible resources and 403 only after membership is known.
- Rate limiting is per route. Billed routes key it on authorization with the IP
  fallback because rate limiting runs before authentication.

## Verification

- Confirm the route is exported from `index.ts` and registered once in
  `server.ts`.
- Exercise success, malformed input, unauthenticated, unauthorized, and missing
  resource paths where applicable.
- Confirm response status and body shapes are unchanged unless explicitly part
  of the task.
