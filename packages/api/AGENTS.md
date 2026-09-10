# API package standards

## Purpose

`packages/api` is the server-side application for Declarative Forms. It exposes
the HTTP API, runs scheduled jobs, applies domain rules, persists state, and
integrates with external systems.

These instructions are authoritative for this package. More specific
`AGENTS.md` files below `src` add rules for their directory; apply both files.

## Architecture

Use this dependency direction:

```text
routes -> core/container -> services -> repositories, gateways, strategies
```

- `src/main.ts` starts the HTTP process and optionally forks workers.
- `src/server.ts` configures Fastify, handles unexpected failures, and registers
  routes.
- `src/scheduler.ts` runs the job worker as a separate process.
- `src/routes` is the presentation and application boundary. It owns HTTP
  parsing, authentication, authorization, status codes, and response shapes.
- `src/core/services` owns orchestration and all business rules. It uses domain
  terminology and knows nothing about HTTP or MongoDB.
- `src/core/repositories` owns persistence queries and mutations. It uses
  storage-oriented terminology and contains no business policy.
- `src/core/gateways` owns outbound third-party protocols.
- `src/core/strategies` owns interchangeable implementations selected by a
  service or the container.
- `src/core/types` owns shared contracts that cross file or layer boundaries.

Routes import only `getContainer` from `../core`. Repositories, gateways, and
strategies never import services. Do not add a layer, wrapper, or interface
unless it has more than one real consumer or implementation.

## Naming

- Files are kebab-case. Services, repositories, and strategies use
  `*.service.ts`, `*.repository.ts`, and `*.strategy.ts`; gateways and types use
  bare concept names.
- Classes match their filename and layer: `FormService`, `FormRepository`,
  `EmailConnectionStrategy`, `GitHubGateway`.
- Repository singular reads use `find` or `findByX`.
- Repository collection reads use `findAll`, `findAllByX`, or an equally
  explicit persisted-filter name such as `findAllByRunAtBeforeNow`.
- Repository writes use persistence verbs: `insert`, `upsert`, `replace`,
  `update`, `delete`, or `setX`. Use `upsert` only when the operation can insert
  or replace. Business verbs belong in services.
- Services use domain verbs. Collection reads use `listByX`, including when they
  proxy a repository `findAllByX` operation.
- Omit the owning class concept from criteria and parameters unless it names a
  different entity or distinguishes multiple identifiers.
- Gateways use remote-capability verbs such as `get`, `find`, `send`, `verify`,
  and `generate`.
- Acronyms are words in identifiers: `Id`, `Url`, `Html`, `Yaml`, `Json`, and
  `Api`. Preserve the product spelling `GitHub`.
- Module constants and environment variables are `SCREAMING_SNAKE_CASE`.
  Persisted fields are `snake_case`; in-memory values are camelCase.

## Coding standards

- Write no comments inside named functions or methods. Prefer a better name,
  constant, or small method over an explanation.
- Do not add unit-test files, fixtures, mocking libraries, or a test framework.
  This package is verified with formatting and TypeScript builds.
- Use `Array<T>`, never `T[]`. Use `unknown` at untrusted boundaries and `any`
  only at an existing named framework or integration boundary.
- Every function and method has an explicit return type. Every class method has
  an explicit `public` or `private` modifier; public methods precede private
  methods.
- Use `type` for shapes and unions. Use `interface` only for a contract fulfilled
  by classes. Shared shapes live in `core/types`, use an `I`-prefixed PascalCase
  name, and are exported from its alphabetical barrel.
- Return an entity, an inline `Pick`, or a primitive with its natural `null` or
  empty-array result. Do not add validation arrays, booleans, or status literals
  merely to select an HTTP error. Throw plain `Error` when no current happy-path
  continuation exists; never inspect an error to drive caller logic or
  introduce result, summary, or DTO wrappers.
- Use `import type` for type-only imports, `node:` for built-ins, non-relative
  imports before relative imports, and parent barrels for cross-folder imports.
- Inject dependencies with private constructor parameter properties named after
  their concrete class. Do not add factories, dependency-injection frameworks,
  pass-through services, or module helpers beside an exported class.
- Use guard clauses, braces on every block, `??` only for nullish defaults, `||`
  for intentional falsy defaults, and namespaced numeric helpers such as
  `Number.parseInt`.
- Prefer `map`, `filter`, and `flatMap` when producing arrays. Keep sequential or
  side-effecting loops when ordering matters.
- Read configuration from `process.env` at the point of use. Add every new
  variable to the root `.env.example` and both relevant `compose.yaml` service
  blocks.
- Prettier owns formatting. Object literal values are alphabetical except that a
  discriminant `type` comes first; type fields remain in logical order.
- Make no compatibility alias, migration, backfill, speculative abstraction, or
  unrelated refactor unless the task explicitly asks for it.

Known exceptions are not patterns to copy: `TokenService` living under
`services`, repeated collection/id literals, and the small inline routes in
`server.ts`. Change them only when requested work requires it.

## Verification

Run in this order:

```bash
npm run lint -w @declarativeforms/api
npm run build -w @declarativeforms/api
npx tsc -b
```

Then inspect the diff and confirm that new methods follow the correct layer
vocabulary, source comments are only intentional TODOs/directives, no test file
was added, and every new environment variable was plumbed through all required
configuration files. Do not run `npm test`; the dormant Jest configuration has
no test files and exits with “No tests found”.
