# API routes: agent instructions

## Purpose

`routes` is the HTTP presentation and application boundary. A route accepts an
HTTP request, validates transport input, establishes caller context, invokes
domain services, and translates the result into an HTTP response.

## Scope and authority

This specification is authoritative for Fastify route definitions in this
directory. Apply it together with the parent `AGENTS.md` files. The words MUST,
MUST NOT, SHOULD, and SHOULD NOT are normative. Existing routes that conflict
with this specification are legacy code to align, not exceptions to copy.

## Responsibilities and boundaries

A route may:

- Read and validate path parameters, query parameters, request bodies, and
  headers.
- Apply authentication, authorization, and other HTTP preconditions through
  pre-handlers.
- Resolve the application container and call domain services.
- Select status codes, headers, redirects, and response bodies.
- Convert an established domain result into its public HTTP representation.

A route MUST NOT:

- Implement reusable business rules or persistence-dependent decisions.
- Access repositories, gateways, strategies, databases, or third-party clients
  directly.
- Import concrete service classes or construct domain dependencies.
- Pass `FastifyRequest`, `FastifyReply`, status codes, or headers into a domain
  service.
- Catch unexpected domain errors. The shared server error handler owns their
  HTTP representation.
- Add a wrapper, DTO, mapper, or helper used by only one straightforward route.
- Contain explanatory source comments. Use clear names and guard clauses; only
  the package-wide TODO and tool-directive exceptions remain allowed.

The required dependency direction is:

```text
route -> core facade/container -> domain service
```

## Contents

- [Purpose](#purpose)
- [Scope and authority](#scope-and-authority)
- [Responsibilities and boundaries](#responsibilities-and-boundaries)
- [Standards](#standards)
  - [Architecture and layout](#architecture-and-layout)
  - [Naming](#naming)
  - [Interfaces and contracts](#interfaces-and-contracts)
  - [Behavior and workflow](#behavior-and-workflow)
  - [Coding standards](#coding-standards)
  - [Errors, security, and edge cases](#errors-security-and-edge-cases)
- [Examples](#examples)
- [Known exceptions](#known-exceptions)
- [Validation checklist](#validation-checklist)
- [Verification](#verification)

## Standards

### Architecture and layout

#### Export and registration

Every route MUST:

1. Be exported exactly once from `routes/index.ts`.
2. Be imported into `server.ts` through the routes barrel.
3. Be passed to `server.route(...)` exactly once.
4. Keep barrel exports and server imports/registrations alphabetically ordered.
5. Have a unique method and URL combination.

Feature routes belong in this directory. Do not add another inline route to
`server.ts`.

### Naming

#### URL, filename, and export name

Every API URL MUST begin with `/api/v1`. Derive the route filename and export
name from the URL and HTTP method as follows:

1. Remove the leading `/api/v1`.
2. Keep the remaining path segments in URL order.
3. Keep static segments as lowercase kebab-case words.
4. Replace each dynamic segment with its stable semantic kind:
   - An entity identifier such as `:id` or `:organizationId` becomes `id`.
   - A human-readable child name such as `:branch` becomes `name`.
   - A meaningful locator that is not an entity id or name retains its kind,
     such as `email`, `key`, `slug`, or `provider`.
5. Give a wildcard `*` its semantic locator name, such as `key` or `slug`.
   Never use `wildcard` or `asterisk` in a filename.
6. Ignore the query string; it does not identify a separate route.
7. Append the lowercase HTTP method.
8. Join the parts with hyphens and add `.ts` for the filename.
9. Convert the filename stem to `SCREAMING_SNAKE_CASE` for the exported
   constant.

Examples:

| Route                                                         | Filename                                   | Export                                  |
| ------------------------------------------------------------- | ------------------------------------------ | --------------------------------------- |
| `GET /api/v1/forms`                                           | `forms-get.ts`                             | `FORMS_GET`                             |
| `GET /api/v1/forms/:id`                                       | `forms-id-get.ts`                          | `FORMS_ID_GET`                          |
| `PUT /api/v1/forms/:id`                                       | `forms-id-put.ts`                          | `FORMS_ID_PUT`                          |
| `DELETE /api/v1/forms/:id`                                    | `forms-id-delete.ts`                       | `FORMS_ID_DELETE`                       |
| `POST /api/v1/forms/:id/publish`                              | `forms-id-publish-post.ts`                 | `FORMS_ID_PUBLISH_POST`                 |
| `GET /api/v1/forms/:id/branches/:branch`                      | `forms-id-branches-name-get.ts`            | `FORMS_ID_BRANCHES_NAME_GET`            |
| `DELETE /api/v1/organizations/:organizationId/members/:email` | `organizations-id-members-email-delete.ts` | `ORGANIZATIONS_ID_MEMBERS_EMAIL_DELETE` |
| `GET /api/v1/files/*`                                         | `files-key-get.ts`                         | `FILES_KEY_GET`                         |

For example, `/api/v1/forms/:id` becomes `forms-id`: `/api/v1` is omitted,
`forms` is retained, and `:id` becomes `id`. Appending the method produces
`forms-id-get.ts`, whose export is `FORMS_ID_GET`.

Each file MUST export exactly one route definition. Routes that share a URL but
use different methods MUST use separate files and exports. For example,
`GET /api/v1/forms/:id` and `DELETE /api/v1/forms/:id` are
`forms-id-get.ts`/`FORMS_ID_GET` and
`forms-id-delete.ts`/`FORMS_ID_DELETE` respectively.

Query parameters never affect naming. Both `/api/v1/forms/:id` and
`/api/v1/forms/:id?branch=main` use `forms-id-get.ts` for a GET route.

Route-adjacent pre-handler modules are the only files in this directory that do
not use a method suffix.

### Interfaces and contracts

#### HTTP method selection

##### GET

Use `GET` to read one resource or a collection. A GET route MUST be safe: it
MUST NOT create, update, delete, publish, enqueue, or otherwise mutate
application state. Use path parameters for resource identity and query
parameters for optional filters, pagination, projections, or version/branch
selection. A GET route normally has no request body.

##### POST

Use `POST` to:

- Create a resource beneath a collection URL.
- Submit data for processing.
- Execute a domain command that is not a resource replacement, such as an
  explicit `/publish`, `/verify`, or `/generate` action.

A POST operation is not assumed to be idempotent. If retries must not repeat an
effect, the route MUST accept and pass a validated idempotency key to a service
that enforces it. Input normally belongs in the request body. Do not encode a
large command payload in the query string.

##### PUT

Use `PUT` to create or completely replace the state of a resource at a known
URL. It MUST be idempotent: repeating the same request expresses the same final
state. The client supplies the complete replaceable representation. Do not use
PUT when omitted fields must retain their previous values. Explicit concurrency
controls, such as an expected revision, may be passed as validated query or
header input when that is part of the public contract.

##### PATCH

Use `PATCH` to update only specified fields of an existing resource. Its body
contains the fields eligible for change; omitted fields retain their existing
values. A PATCH route MUST NOT silently perform full replacement. PATCH
operations SHOULD be idempotent for the same request in this API.

##### DELETE

Use `DELETE` to remove or deactivate the resource identified by the URL. The
intended final state MUST be idempotent: repeating the request cannot recreate
the resource or apply an additional mutation. A DELETE route normally identifies
its target through path parameters and has no request body.

##### HEAD and OPTIONS

Use Fastify and registered plugins for standard `HEAD` and `OPTIONS` behavior.
Add a dedicated route only when the endpoint requires behavior that the
platform does not provide.

The API currently uses `200` for successful creates, updates, deletions, and
commands, including successful operations with an empty body. Do not introduce
`201` or `204` without an explicit API-contract change.

#### Route definition

Export a Fastify `RouteOptions<any, any, any, any>` object. The four `any`
arguments are the approved existing Fastify framework boundary; they do not
permit `any` in request bodies, query values, domain data, or application code.

The supported properties MUST appear in this order when present:

1. `config` — optional route metadata.
2. `handler` — required async request handler.
3. `method` — required uppercase HTTP method.
4. `preHandler` — optional pre-handler or ordered array of pre-handlers.
5. `url` — required literal path beginning with `/api/v1`.

Omit optional properties when they are unused. Do not add empty `config` or
`preHandler` values.

Other Fastify route properties, including `schema`, `onRequest`, `onSend`,
route-local content parsers, and route-local error handlers, are outside the
established route contract. Add one only when a requested architectural change
also updates this specification.

Use one uppercase method string, not a method array. One route definition
represents one method and URL pair.

#### Request types

Use an async arrow handler with explicit `FastifyRequest` and `FastifyReply`
types. Add only the request generic members used by the route. The supported
members are `Body`, `Headers`, `Params`, and `Querystring`; preserve this order
when more than one is present.

##### Params

Use `Params` when the URL contains a named parameter or wildcard. Its keys MUST
cover every placeholder in the URL, even when a pre-handler is the only code
that reads one. Named path parameters are required strings because a matching
route cannot omit them.

```typescript
request: FastifyRequest<{
  Params: { organizationId: string; id: string };
}>;
```

The names MUST exactly match the URL:

```text
/api/v1/organizations/:organizationId/forms/:id
                         ^ organizationId       ^ id
```

Read a Fastify wildcard through `request.params['*']` and type it as
`{ '*': string }`. Validate a parameter's format in the route only when the HTTP
contract defines that syntax. Resource existence and other domain meaning
belong in the service.

##### Querystring

Use `Querystring` for optional read controls, filters, pagination, modes, or
concurrency inputs. Client-controlled query fields SHOULD be optional because
their absence is distinct from an empty value.

The server uses `qs`, which can produce arrays and objects even when the
TypeScript annotation says `string`. Runtime-narrow every query value before
passing it to a service:

```typescript
const branch =
  typeof request.query.branch === 'string' ? request.query.branch : undefined;
```

Parse numeric strings with namespaced helpers such as
`Number.parseInt(value, 10)`, then validate the result with the required
`Number` predicate. Do not use truthiness as type validation.

##### Body

Use `Body` only when the method accepts a payload. Fields supplied by an
untrusted client MUST be optional `unknown` until runtime-validated:

```typescript
Body: { name?: unknown };
```

Check that a body exists before reading from it when the parser may supply
`undefined` or a non-object value. Use `Record<string, unknown>` only when
arbitrary object keys are part of the public contract. Do not use
`Record<string, any>` for new routes.

Validate transport properties in the route, including required presence,
primitive type, empty values, length, and public syntax. Services own reusable
domain invariants, authorization policy, uniqueness, state transitions, and
persistence-dependent checks.

##### Headers

Add `Headers` only for a custom typed header contract consumed by the handler.
Fastify already types standard headers, so do not redeclare them without need.
Header values can be strings, arrays, or absent and MUST be narrowed or
normalized before they reach a service.

##### Decorated request context

Values attached by a pre-handler use the project's Fastify declaration merging;
do not repeat them in the request generic. A handler may use a non-null assertion
only when its configured pre-handler guarantees that value or terminates the
request. The specific context fields and authorization helpers are application
concerns, not part of this general route definition.

### Behavior and workflow

#### Handler flow

When a route uses domain services, the first executable handler statement MUST
resolve the container and destructure only the required services:

```typescript
const { resourceService } = await getContainer();
```

Do not resolve the container at module scope. A route that calls no service MUST
NOT resolve it.

After container resolution, use this order:

1. Normalize and validate HTTP input.
2. Send `400` and return for malformed transport input.
3. Invoke domain services.
4. Translate expected absence or other safe outcomes.
5. Send exactly one successful response.

Use guard clauses. Every handled branch MUST terminate the HTTP response with
`send()` or `redirect()`. After a guard response, leave a blank line and return:

```typescript
if (!resource) {
  reply.status(404).send();

  return;
}
```

Do not catch service or domain exceptions in a handler. Catch an error only when
the route layer can genuinely recover or translate a transport operation, such
as failed credential parsing in an authentication pre-handler.

#### Service access

A handler may call domain services obtained from the container. It MUST NOT call
a repository, gateway, strategy, SDK, database driver, or other infrastructure
dependency, even if that dependency is available from the container.

Pass validated primitive or domain inputs to services. Do not pass unvalidated
body, query, or header values. Path parameters may be passed as strings when the
router guarantees their presence and the service owns their domain validity.

Name local results after the domain value returned by the service. Do not rename
a service operation with transport terminology or introduce a one-use result
type.

#### Pre-handlers

Omit `preHandler` for public routes. Use one function directly when there is one
precondition and an array when multiple concerns must run in order.

Pre-handlers may:

- Validate credentials.
- Establish identity.
- Authorize access.
- Load and attach typed request context.
- Send an HTTP failure response and terminate processing.

Identity establishment MUST precede authorization or contextual resource
loading. Pre-handlers MUST NOT implement the endpoint's domain workflow or
mutate its target resource.

Authentication and authorization pre-handlers MAY assign declared request
context registered with `decorateRequest`, such as `request.email` and
`request.organization`. They MUST NOT mutate request input or undeclared
properties.

A reusable pre-handler declares explicit Fastify parameters and a
`Promise<void>` return type:

```typescript
export async function establishContext(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Implementation omitted.
}
```

The comment above is illustrative documentation and MUST NOT be copied into a
source file.

#### Route configuration and rate limiting

Use `config` only for supported per-route metadata. Omit it when the route needs
no metadata.

Costly, externally billed, or abuse-sensitive routes MUST define an explicit
rate limit. Choose the limit from the endpoint's actual operational and product
requirements; this specification does not invent a universal value.

When a protected or billed route needs caller-based limiting, use the
authorization header with the client IP as fallback because rate limiting runs
before authentication:

```typescript
keyGenerator: (request: FastifyRequest) =>
  request.headers.authorization || request.ip,
```

The rate-limit plugin owns `429` responses. Do not reproduce rate-limit logic in
the handler.

### Coding standards

#### Imports

All imports MUST be at the top and ordered in these groups:

1. Scoped packages beginning with `@`, including internal workspace packages.
2. Unscoped npm packages and `node:` built-ins.
3. Parent and sibling relative paths.

Use `import type` whenever an import is used only as a type. Do not add blank
imports for side effects in route modules.

Routes obtain application services only through `getContainer` imported from
the parent core facade:

```typescript
import { getContainer } from '../core';
```

Do not import a concrete service, repository, gateway, strategy, database
client, or container implementation. Relative imports may provide reusable
route pre-handlers.

### Errors, security, and edge cases

#### Responses and errors

Use these mappings unless an endpoint's explicit public contract requires a
different response:

| Condition                                            | HTTP response                        |
| ---------------------------------------------------- | ------------------------------------ |
| Successful resource or command                       | `200` with the direct representation |
| Successful operation without a representation        | `200` with an empty body             |
| Malformed HTTP input                                 | `400` with an empty body             |
| Missing or invalid authentication                    | `401`                                |
| Known caller lacks permission and disclosure is safe | `403`                                |
| Missing or intentionally invisible resource          | `404`                                |
| Conflicting domain state                             | `409` with an empty body             |
| Semantically invalid domain operation                | `422` with an empty body             |
| Upstream rate limit                                  | `429` with an empty body             |
| Known unavailable capability                         | `503`                                |
| Rate limit exceeded                                  | Plugin-owned `429`                   |
| Unexpected exception                                 | Shared `500` handling                |

Use `404`, rather than `403`, when revealing the resource or membership would
leak information. Use `403` only after the caller and relevant membership or
visibility are known safely.

Expected non-success responses have an empty body. Send resources directly
without a general `{ data: ... }` envelope. An
endpoint-specific projection is allowed only when it is the established public
representation. Keep localized or user-facing prose out of route error bodies.

Set headers before sending the response. Use `redirect()` only when redirecting
is the endpoint's intended HTTP contract.

## Examples

### Canonical route

`GET /api/v1/forms/:id` is defined in `forms-id-get.ts` and exported as
`FORMS_ID_GET`:

```typescript
import type { IDeclarativeForm } from '@declarativeforms/engine';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const FORMS_ID_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { branch?: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { formService } = await getContainer();

    const branch =
      typeof request.query.branch === 'string'
        ? request.query.branch
        : undefined;

    const form: IDeclarativeForm | null = await formService.findById(
      request.params.id,
      branch,
    );

    if (!form) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send(form);
  },
  method: 'GET',
  url: '/api/v1/forms/:id',
};
```

The example is concrete so its naming and structure can be validated. Product
entities and service names shown in an example do not create general-purpose
requirements for unrelated routes.

## Known exceptions

`GET /api/v1/auth/:provider/callback` is an OAuth protocol callback. It may
exchange the provider's one-time code and persist only the short-lived,
single-use authentication handoff required to complete sign-in. It MUST NOT
mutate product or domain resources.

The existing root, health, and ping routes are legacy composition exceptions,
not patterns for feature work.

## Agent validation checklist

Before accepting a route, confirm all of the following:

- The URL begins with `/api/v1`.
- The filename and exported constant derive from the URL and method exactly.
- The method matches the operation's read, create/command, replace, partial
  update, or delete semantics.
- The file exports exactly one route definition.
- Imports are grouped correctly and type-only imports use `import type`.
- The route uses only supported `RouteOptions` properties in canonical order.
- `Body`, `Headers`, `Params`, and `Querystring` appear only when needed and in
  canonical order.
- `Params` covers every URL placeholder with exactly matching keys.
- Every untrusted body, query, and header value is runtime-validated before
  reaching a service.
- A service-using handler resolves the container as its first executable
  statement and destructures only required services.
- The route imports and invokes no repository, gateway, strategy, concrete
  service class, database, SDK, or third-party client.
- Every guard sends a response, leaves a blank line, and returns.
- The route does not catch unexpected domain exceptions.
- Status codes and response bodies follow the established contract.
- Pre-handlers are present only when required and run in dependency order.
- The route is exported once and registered once.
- No explanatory source comments, unrelated refactors, compatibility aliases,
  speculative abstractions, or new dependencies were introduced.

## Verification

For route code changes, run the package verification commands defined in the
parent `AGENTS.md`. Then inspect the diff and confirm the validation checklist
above. Do not add route unit tests, fixtures, mocks, or a test framework; this
package uses formatting and TypeScript builds for verification.
