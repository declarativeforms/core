# API service standards

## Purpose

`services` is the domain service layer. It owns business decisions,
authorization rules beyond transport authentication, workflow orchestration,
and domain-oriented operations.

## Architecture

- Services know nothing about Fastify, HTTP status codes, response envelopes, or
  MongoDB query syntax.
- A service may use repositories, gateways, strategies, or another service when
  coordinating a real workflow.
- Keep a service only when it owns domain rules or has multiple consumers. Put
  single-consumer logic on that consumer as a private method.
- Return expected business outcomes directly; routes select their HTTP
  representation.

## Naming

- Name a class after its domain concept: `<DomainConcept>Service`.
- Public methods use business verbs such as `schedule`, `publish`, `verify`, or
  `consume`.
- Singular reads use `find` or `findByX`. Collection reads use `listByX`.
- Prefix accessors that compute or retrieve a value with `get`, such as
  `getAccessTokenTtlSeconds`.
- Name injected dependencies after their concrete class.

## Coding standards

- Public methods precede private helpers and every method declares its access
  modifier and return type.
- Return `null`, `false`, validation issues, or a direct scalar for expected
  outcomes. Throw plain `Error` only when the caller cannot continue.
- Return entities, primitives, or inline `Pick` projections. Do not create a
  result/summary/DTO type for one method.
- Accept an id instead of an entity unless the method reads other entity fields.
- Keep input validation at trust boundaries and business invariants here; do not
  push them into repositories.
- Do not wrap another service merely to rename or narrow its methods.

`TokenService` in this directory is a known exception, not an example for new
code.

## Verification

- Trace every renamed public method through routes, other services, and the
  container.
- Confirm business behavior, error outcomes, and returned values remain stable.
- Confirm no service mentions HTTP status codes, `reply`, headers, or raw MongoDB
  operators in new code.
