# packages/api: coding standards

This file describes how code in `packages/api` is written. It is not aspirational.
Every rule below is already true of the code in `src`, and each one cites a file
that demonstrates it.

If this file and the code disagree, the code is wrong. Fix the code, then keep
this file accurate.

This is an internal engineering document. It has nothing to do with
`packages/core/public/AGENTS.md`, which is a published product asset that teaches
external agents to author YAML forms.

## Contents

- [The non-negotiables](#the-non-negotiables)
- [Layout and dependency direction](#layout-and-dependency-direction)
- [Comments](#comments)
- [Tests](#tests)
- [Types](#types)
- [Return values](#return-values)
- [Repositories](#repositories)
- [Classes](#classes)
- [Naming](#naming)
- [Imports](#imports)
- [Configuration](#configuration)
- [Control flow and nullability](#control-flow-and-nullability)
- [Errors](#errors)
- [Routes](#routes)
- [The container](#the-container)
- [Formatting](#formatting)
- [Known inconsistencies](#known-inconsistencies)
- [Before you hand work back](#before-you-hand-work-back)

## The non-negotiables

Break any of these and the change is wrong, regardless of whether it compiles.

1. **No comments.** The only comment permitted in `src` is `// TODO:`.
2. **No test files.** This package ships without unit tests.
3. **Every shared type lives in `src/core/types/`** and is `I`-prefixed.
4. **`Array<T>`, never `T[]`.**
5. **Every method carries an explicit `public` or `private` modifier.**
6. **Every function and method carries an explicit return type.**
7. **`null` means absent.** Never return `undefined` to mean "not found".
8. **No module-level helper functions in a file that exports a class.**
9. **No result objects.** A function returns the entity, a `Pick` of it, or a
   primitive on success, `null` when the caller can safely carry on without it,
   and throws a domain error when it cannot. A type whose only job is to bundle
   one function's return values is banned whether or not it carries a
   discriminant, and whether or not its name ends in `Result`. See
   [Return values](#return-values).
10. **Repository methods name the operation, not the entity**, and their
    parameters do not repeat it. See [Repositories](#repositories).
11. **No service layer with a single consumer.** If only one caller needs the
    logic, it is a private method on that caller.
12. **No backwards compatibility.** No migration, no backfill, no repair pass,
    and no keeping an old document shape readable, unless the task asked for it
    in those words.
13. **Nothing unrequested.** No flag, policy, limit or restriction that the task
    did not ask for. A restriction nobody asked for still has to be understood,
    plumbed and removed later.
14. **A service never names an HTTP status.** Domain code throws a domain error
    from `src/core/errors.ts`. `server.ts` chooses the status. See
    [Errors](#errors).
15. **`src/core/services/` holds domain services only.** A domain service owns a
    rule about a domain entity: a form, a submission, an organization, a job. A
    class that only transforms bytes is mechanism, not domain. See
    [Classes](#classes).
16. **A feature is not a licence to restructure the code path it lands in.** If
    a hunk in your diff is not required by the feature, revert it. Rule 13 bans
    unrequested features; this bans unrequested refactors.

## Layout and dependency direction

Three entry points, two processes:

- `src/main.ts`: process entry for the HTTP server. Loads `dotenv`, then either
  serves directly or forks one worker per CPU when `CLUSTER` is set.
- `src/server.ts`: builds the Fastify instance, registers plugins, registers each
  route, listens. Exports `startServer()`.
- `src/scheduler.ts`: a wholly separate process entry. It loads `dotenv`, wires
  `SIGINT`/`SIGTERM` to an `AbortController`, and runs `jobService.run(signal)`.
  It shares no bootstrap code with `main.ts` beyond the `dotenv` call.

Inside `src`, dependencies flow one way:

```
routes  ->  core (container)  ->  services  ->  repositories, gateways, strategies
```

- **Routes never reach past the container.** Every route imports exactly
  `{ getContainer } from '../core'` and nothing else from `core`. Do not import a
  service class into a route.
- **Services own the business rules, and know nothing about HTTP.** No status
  code, no `reply`, no header, no request envelope. Repositories own
  persistence, gateways own outbound HTTP to third parties, strategies own
  per-connection-type delivery.
- **Repositories and gateways never import a service.** A service may depend on
  another service: `SubmissionService` takes `FormService` and `JobService`.

`src/core/index.ts` re-exports every layer, so `core` is a single facade.

## Comments

**Write no comments.** Not on exported classes, not on non-obvious algorithms,
not to mark sections of a method. There are zero prose comments and zero block
comments in this package, and that is intentional.

If you feel the need to explain something, that is a signal to change the code
instead:

- Rename the variable or method so the name carries the explanation.
- Extract a private method whose name states the intent.
- Introduce a named constant instead of a literal.

**The single exception is `// TODO:`.** A TODO records a concrete refactor of the
code directly beneath it, phrased as an imperative instruction to whoever picks
it up. It never explains behaviour and never records an opinion.

```ts
// TODO: move this into the EmailConnectionStrategy class as a private method
// TODO: move to types directory
// TODO: change Job[] to Array<Job>
// TODO: move to environment variables
```

Do not write `// TODO: revisit this` or `// TODO: might be slow`. If you cannot
state the action and its target, do not write the TODO.

## Tests

**This package has no unit tests, and you should not add any.** Do not create
`*.test.ts` files. Do not add a test framework, a mocking library, or fixtures.

Verification here is the type checker, the linter, and exercising the running
service. See [Before you hand work back](#before-you-hand-work-back).

**Known state of the dormant jest tooling.** `jest.config.cjs`,
`"test": "jest"`, and the jest devDependencies are still present but no test
files match them. Consequences you should recognise rather than "fix":

- `npm test` in this package, and at the repo root, exits 1 with
  "No tests found". That is the expected state, not a regression.
- `jest.config.cjs` maps `@faker-js/faker` to `src/test/faker.mock.ts`, a file
  that does not exist and never did.
- `.github/workflows/publish.yml` only builds and pushes Docker images. It never
  runs `npm test`, `npm run lint`, or a typecheck, so nothing is deploy-blocking.

## Types

**Use a `type` alias for shapes, unions and function types.** `type` is used for
every declared shape in the package.

```ts
export type IJob<T = unknown> = {
  id: string;
  event: string;
  data: T;
  run_at: Date;
};
```

**Use `interface` only for a contract that classes fulfil.** There is exactly one
in the package, `IConnectionStrategy` in `src/core/strategies/index.ts`. Even
then the concrete classes do not write `implements`: the container relies on
structural typing where it declares
`const connectionStrategies: Array<IConnectionStrategy>`. Follow that. Do not add
`implements` clauses.

**Shared types live in `src/core/types/`, one concept per kebab-case file, with
an `I`-prefixed PascalCase name.** No `.type.ts` suffix on the filename.

```
src/core/types/downloaded-file.ts  ->  IDownloadedFile
src/core/types/github-file.ts      ->  IGitHubFile
src/core/types/job.ts              ->  IJob
```

The barrel is a flat alphabetical list of star exports, nothing else:

```ts
export * from './downloaded-file';
export * from './github-file';
export * from './job';
```

A type that belongs to a single implementation file and is exported alongside it
may stay in that file: `JobHandler` in `job.service.ts`, `Container` in
`container.ts`. These are the local exception, not the pattern. **The moment a type describes data that crosses a layer boundary,
it moves to `core/types/` and takes the `I` prefix.**

Two limits on that last sentence, both of which `core/types/` has been wrong
about before:

**A type used in one file, and not exported, is written inline at its use site.**
Hoisting it to module scope for the sake of naming it buys nothing.

```ts
.collection<{ _id: string; value: number }>('message_sequences')   // correct
```

```ts
type MessageSequence = { _id: string; value: number };             // wrong
```

**A third-party protocol shape never leaves the gateway that speaks it.** Nothing
describing OpenAI's request body, its response envelope, a prompt turn or a
repair attempt belongs in `core/types/`, because then every layer can see it and
the barrel invites them to. A gateway's public method takes entities and
primitives and returns primitives, with the return type written inline:

```ts
public async generate(
  prompt: string,
  definition: string | null,
  history: Array<IFormMessage>,
  repair: { definition: string; errors: Record<string, string> } | null,
): Promise<{ definition: string; message: string; name: string | null }>
```

`ResponsesPayload` in `openai.ts` is the shape of what OpenAI sends back. It is
hoisted because four methods in that file read it, and it stays in that file for
the same reason `core/types/` never hears about the wire format of a webhook.

**Use `Array<T>`. Never use `T[]`.**

```ts
public async findDue(limit = 25): Promise<Array<IJob>> {              // correct
const connectionStrategies: Array<IConnectionStrategy> = [            // correct
const rows: Array<string> = [];                                      // correct
```

**Never declare an `enum`.** There are none. Use a string literal union.

**Domain payloads of unknown shape are `unknown`, not `any`.**

```ts
export type JobHandler = (data: unknown) => Promise<void>;
```

**`any` is permitted only at these named integration boundaries**, and nowhere
else:

- The Fastify route generic slot: `RouteOptions<any, any, any, any>`.
- An inspected caught error: `catch (error: any)` in `file.service.ts`.
- The Fastify raw content-type parser parameters in `server.ts`.
- The job payload bridge in `container.ts`: `const { connection, form,
  submission } = data as any;`.
- `IConnectionStrategy.handle`'s `connection: any`, which is deliberately loose
  so both connection shapes satisfy it.

**Give a generic parameter a default when callers usually do not supply it:**
`IJob<T = unknown>`.

**Tag a discriminated union on `type`**, on the rare occasion one is warranted.
`IOAuthProviderStrategy` and `IConnectionStrategy` discriminate this way. Never
use one as a return value: see [Return values](#return-values).

## Return values

**Never invent a type to carry a function's return values out of a service.**
Tagged shapes like `{ type: 'invalid' | 'conflict' }` are banned, and so are
untagged bundles: `IFormGenerationResult` was a three-field DTO with no
discriminant and it was still wrong. The name is not the test. If a type exists
only because one function needed to hand back more than one thing, it should not
exist.

The contract is three-way:

- **The entity, a `Pick` of it, or a primitive.** `Promise<IInternalForm>`,
  `Promise<Array<string>>`, `Promise<string | null>` for an email address.
- **`null` when the caller can safely carry on.** It means "absent, or not
  visible to you". A route turns `null` into 404 and nothing else.
- **Throw when it cannot.** Anything that is not a safe failure is a domain
  error from `src/core/errors.ts`, carrying the facts the route needs and no
  status code.

**A caller that needs less than the whole entity gets a `Pick`, written inline
at the signature.** Never declare a bespoke `*Summary` or `*Dto`. A projection is
a view of an entity, not a new concept, so it does not earn a name in
`core/types/`.

```ts
public async list(
  organizationId: string,
): Promise<
  Array<
    Pick<
      IInternalForm,
      'form_id' | 'name' | 'organization_id' | 'revision' | 'updated_at'
    >
  >
>
```

**If the projection wants a field the entity does not have, that field belongs on
its own endpoint.** Do not bolt it on. `IInternalFormSummary` carried `branches`,
which is not on `IInternalForm`, and paid for it with one extra query per form
over a list capped at 200. `GET .../forms/:id/branches` already existed.

**Type a return as loosely as the caller actually needs.** Do not name a shape,
and do not narrow an error, on the strength of a requirement nothing downstream
has. Two entities are `Array<IFormMessage>`, not a wrapper with a field for each.

**The one shape that is not a result object is a cursor page.**
`IFormMessagePage` is `{ messages, next_cursor }`, and `next_cursor` has no
entity to belong to: it describes the query, not the data. A page earns its type
in `core/types/`. Nothing else in this package does.

This ban governs services, repositories and gateways in this package. It is about
smuggling a status code out of a layer. `SubmitResult` in `packages/core` is a
rendering state union consumed by the component that owns it, and it is
deliberately out of scope.

```ts
public async update(...): Promise<IInternalForm | null>   // null -> 404
public async createOrUpdate(...): Promise<ISubmission | null>  // or throws
```

`createOrUpdate` throws `ValidationError` when the submission fails validation,
and returns `null` when the form or the submission is not there.

Prefer `null` wherever the caller can carry on.
`EmailVerificationService.request` returns `Promise<string | null>` and lets the
route decide that an undelivered code is a 502; it does not decide that
itself.

## Repositories

A repository already names its entity in the class name. Method names therefore
name the **operation**, and parameters do not repeat the entity.

| Rule | Example |
| --- | --- |
| `find*` returns one entity, or a derived list of primitives | `findBranchNames(id)` |
| `listBy<Field>` returns many entities filtered by that field | `listByOrganization(organizationId, branch)` |
| `insert` / `replace` / `delete` name the operation | `delete(id, branch)` |
| Parameters drop the entity prefix | `id`, never `formId` |

`FormRepository.delete(id, branch)` removes one branch document;
`softDelete(id)` marks every branch of a form deleted. The prefix survives
only where it names a genuinely different entity, as in
`SubmissionRepository.find(formId, id)`.

`FormMessageRepository.listByBranch(formId, organizationId, branch, ...)` is
**correct and must not be "fixed"**. In that repository `id` is the message id,
so `formId` names a genuinely different entity, exactly as in
`SubmissionRepository`.

Every read passes `projection: { _id: 0 }`. Mongo's `_id` is never part of an
entity this package returns.

**A repository reads the clock.** `new Date()` is called inside the method that
writes the timestamp. `now` and `at` are never parameters: they widen the
signature, invite two callers to disagree about what time it is, and tell the
caller about a column it does not own.

```ts
public async softDelete(id: string): Promise<boolean>          // correct
public async findDue(limit = 25): Promise<Array<IJob>>         // correct
public async reschedule(id: string, runAt: Date): Promise<void>  // correct
```

`reschedule` keeps its parameter because `run_at` is a domain decision, not the
current time. The test is whether the caller chose the instant or merely
observed it.

**Classify an entity with `tags: Array<string>`, not a boolean and not a
foreign-key flag.** A tag costs one field and absorbs the next three
requirements; `can_use_email_connection` and `personal_for` each cost a field, a
type change, an index and a migration. A personal workspace is
`tags: ['personal']`.

Uniqueness that used to live on the flag moves into a unique partial index
filtered on the tag. Filter on the tag, key on the scalar that has to be unique:

```ts
await this.db.collection<IOrganization>('organizations').createIndex(
  { created_by: 1 },
  {
    partialFilterExpression: { tags: 'personal' },
    unique: true,
  },
);
```

Do not put the tag in the index key alongside another array path.
`{ tags: 1, 'members.email': 1 }` is two array paths and Mongo refuses to index
parallel arrays.

## Classes

Every gateway, repository, service and strategy is a class. There are no factory
functions and no exported free functions in these folders.

**One class per file**, named to match the filename.

**Inject dependencies as constructor parameter properties, marked `private`.**
Not `private readonly`: there are zero occurrences of `readonly` on an injected
dependency in this package, and adding one would be inconsistent.

```ts
constructor(private db: Db) {}
```

```ts
constructor(
  private formService: FormService,
  private submissionRepository: SubmissionRepository,
  private jobService: JobService,
) {}
```

A single-parameter constructor collapses onto one line with an empty body. A
multi-parameter constructor expands one parameter per line with a trailing comma.

**`readonly` is used only for a strategy discriminant:**
`readonly type = 'email';`. Note it carries no access modifier, unlike methods.

**Every method is explicitly `public` or `private`.** No implicit-public methods.

**Public methods come first, private helpers last.** `SubmissionService` reads
`createOrUpdate`, `findById`, then `validate`, then `scheduleConnections`.

**No `static` members, with one exception.** `HttpError` in `src/core/errors.ts`
carries `forbidden()`, `conflict()` and `invalid()` as static factories,
precisely because module-level helpers are banned in a file that exports a
class. Do not add statics anywhere else.

**No module-level helper functions in a class file.** A helper belongs on the
class as a `private` method. `EmailConnectionStrategy.generateResponsesHtml` is
private for this reason, and `WebhookConnectionStrategy` has no helpers at all.
Plain `function` declarations are reserved for entry-point scripts, such as
`startServer()` in `server.ts` and `main()` in `scheduler.ts`, and for route
preHandlers in `src/routes/`, such as `authenticate` and
`authorizeOrganization`. A preHandler is shared across route files and is not a
method on anything, so it stays a function.

**Annotate every return type.** `Promise<void>` on mutating methods,
`Promise<T | null>` on lookups, `Promise<number>` on counts.

**A class in `services/` owns a rule about a domain entity.** A class that only
transforms bytes, that signs, hashes, encodes or compares, is mechanism. Before
you write one, check whether something in the package already does the job:
`TokenService` mints and verifies AAD-scoped, optionally-expiring tokens for any
purpose, and a second signer was deleted once it turned out to be that class
with a different cipher. Mechanism that survives that test belongs to the domain
service that uses it, as a private method or as a public method on the one class
that owns the concept. `EmailVerificationService.verifyProof` is public because
`SubmissionService` needs it, and it sits there because email verification owns
the proof.

**Take the id, not the entity.** A parameter is typed `IOrganization` only when
the body reads something other than `id`. Everything else takes
`organizationId: string`.

```ts
public async list(organizationId: string): Promise<...>          // reads id only
public assertAdmin(organization: IOrganization, email: string): void  // reads members
```

`OrganizationService` is the one class that keeps the whole object, because
`findMember`, `assertAdmin` and `removeMember` all read `members`. Passing an
entity where an id would do hides which field the method actually depends on, and
it forces every caller to have loaded the entity first.

## Naming

**Files**, kebab-case, with a suffix that names the layer:

| Folder         | Pattern              | Example                        |
| -------------- | -------------------- | ------------------------------ |
| `services`     | `*.service.ts`       | `submission.service.ts`        |
| `repositories` | `*.repository.ts`    | `github-file.repository.ts`    |
| `strategies`   | `*.strategy.ts`      | `email-connection.strategy.ts` |
| `gateways`     | bare name, no suffix | `github.ts`                    |
| `types`        | bare name, no suffix | `downloaded-file.ts`           |

**A class in `services/` is named `<DomainEntity>Service`**, after the entity
whose rules it owns. A name that reads as a verb phrase about bytes, such as
`ProofService`, `HashService` or `SignerService`, is the signal that rule 15 has
been broken: the class is mechanism, and it either belongs to an existing class
or should not exist.

**Route files** are the static path segments in URL order with `/api/v1/`
dropped, plus a generic placeholder word for each dynamic or wildcard segment,
plus the HTTP method last:

| File                             | Route                                        |
| -------------------------------- | -------------------------------------------- |
| `forms-id-get.ts`                | `GET /api/v1/forms/:id`                      |
| `forms-id-submissions-post.ts`   | `POST /api/v1/forms/:id/submissions`         |
| `forms-slug-get.ts`              | `GET /api/v1/forms/:owner/:repository/*`     |
| `files-key-get.ts`               | `GET /api/v1/files/*`                        |

The placeholder word describes the segment and need not match the Fastify
parameter name: `files-key-get.ts` reads `request.params['*']`.

**The exported route constant is the filename in `SCREAMING_SNAKE_CASE`:**
`forms-id-submissions-post.ts` exports `FORMS_ID_SUBMISSIONS_POST`.

**Capitalise acronyms as words** in identifiers: `Html`, `Url`, `Id`, `Yaml`,
`Api`. So `generateResponsesHtml`, `retrieveYamlFile`, `publicBaseUrl`,
`submissionId`. `GitHub` keeps its own product casing, as in `IGitHubFile` and
`gitHubGateway`.

**Module-level constants are `SCREAMING_SNAKE_CASE`**, and are only hoisted when
reused across methods in the same file.

**Environment variables are `SCREAMING_SNAKE_CASE` with a vendor or subsystem
prefix**: `GITHUB_TOKEN`, `GITHUB_DEFAULT_BRANCH`, `MONGODB_DATABASE_NAME`,
`AWS_S3_BUCKET_NAME`, `RESEND_FROM_EMAIL`. Do not introduce a bare name such as
`DEFAULT_BRANCH` in a process that also talks to Mongo and S3.

**Persisted field names are `snake_case`**, matching the stored documents:
`run_at`, `form_id`, `created_at`, `ip_address`. In-memory locals stay camelCase,
so a mapping such as `run_at: runAt` is correct and expected.

## Imports

**Use `import type` for every type-only import.**

```ts
import type { IJob } from '../types';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
```

When one statement needs both a value and a type from the same module, mark the
type inline and place it last in the list, after the plain named imports:

```ts
import {
  EmailConnectionStrategy,
  WebhookConnectionStrategy,
  type IConnectionStrategy,
} from './strategies';
```

**Prefix Node builtins with `node:`**: `node:crypto`, `node:timers/promises`,
`node:cluster`, `node:os`.

**Two groups, non-relative first, then relative. Alphabetical within each group,
sorted as plain strings**, so `dotenv` precedes `node:cluster`, and
`@declarativeforms/engine` precedes `mongodb`. Alphabetise the named imports
inside each statement too.

**One statement per module.** Never import twice from the same specifier. The one
allowed pairing is a value import plus an `import type` from the same module when
the type list is long enough to warrant its own block, as in
`email-connection.strategy.ts`.

**Cross-folder imports go through the parent barrel. Same-folder imports go
direct to the file.**

```ts
import type { GitHubFileRepository } from '../repositories';   // correct
import type { FormService } from './form.service';             // correct
import { getContainer } from '../core';                        // correct, routes
```

**Never write a path deeper than one `../`.** If you need `../../`, the code is
in the wrong folder.

## Configuration

**There is no config module, and you should not add one.** Read `process.env`
inline at the point of use.

```ts
const GITHUB_FORM_PREFIX = process.env.GITHUB_FORM_PREFIX || 'a';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const forcePathStyle = process.env.AWS_S3_FORCE_PATH_STYLE === 'true';
const bucket = process.env.AWS_S3_BUCKET_NAME as string;
```

The three idioms, and when each applies:

- `|| 'default'` when the variable is optional and a sensible fallback exists.
- `as string` when the variable is required and the process cannot work without
  it. There is no validation layer. A missing value fails inside the downstream
  SDK.
- `=== 'true'` to read a boolean.

`dotenv`'s `config()` is called only in `main.ts` and `scheduler.ts`. No other
file loads it, and `server.ts` and `container.ts` rely on whichever entry point
imported them.

**Every new variable must be plumbed through in three places**, not one:

1. Read it inline where it is used.
2. Document it in the root `.env.example`, with a comment saying what it does,
   what the default is, and any consequence of changing it.
3. Add it to the relevant service `environment:` blocks in `compose.yaml`, using
   `${NAME:-default}`. The `api` and `scheduler` services both construct the same
   container, so a variable read at module scope in `core` needs to appear in
   both.

## Control flow and nullability

**Guard clauses first, happy path last.** Every method opens with its rejections.

```ts
public async findById(id: string): Promise<IDeclarativeForm | null> {
  if (!id.startsWith(GITHUB_FORM_PREFIX)) {
    return null;
  }

  const gitHubFile = await this.gitHubFileRepository.find(id);

  if (!gitHubFile) {
    return null;
  }
  ...
```

**Always brace a block. Never write a single-line `if`.**

**`null` means "this domain object is absent".** Every lookup returns
`Promise<T | null>`. **`undefined` is only for optional parameters and loop
state**, as in `let currentId: string | undefined = compiled.sections[0]?.id;`.
A route converts an empty query value to `undefined` so a service default
parameter can take over: `request.query.branch || undefined`.

**`??` for nullish defaults only. `||` for falsy defaults and boolean logic.**
This distinction is applied precisely throughout, so keep it precise:

```ts
form.sections ?? []                  // an empty array is a valid value
connection.delay_minutes ?? 0        // 0 is a valid value
process.env.AWS_REGION || 'us-east-1'  // an empty string should fall back
if (!to || !subject) {                 // boolean logic
```

**Use numeric separators for millisecond arithmetic:** `60_000`.

**Use the namespaced numeric statics**, never the globals: `Number.parseInt(x,
10)`, `Number.isInteger(x)`.

**Produce an array with `.map`, `.filter` or `.flatMap`. Never a `for...of` that
pushes into a local.**

```ts
return documents
  .map((document) => document.origin_message_id)
  .filter((id): id is string => id !== null);
```

```ts
const ids: Array<string> = [];              // wrong

for (const document of documents) {
  if (document.origin_message_id) {
    ids.push(document.origin_message_id);
  }
}
```

Reach for `Promise.all(items.map(...))` only when the calls are safe to run at
once. A loop that must await in sequence stays a loop.

The rule covers arrays. A loop that builds a `Set` or a `Record` stays a loop:
`normalizeRedirectUris` in `authentication.service.ts` and `toErrors` in
`internal-form.service.ts` are both correct as written.

**`for...of` is still correct** in four cases. Use `continue` to skip.

- A side effect: `toDefinition` deletes metadata keys off a copy.
- `await` in sequence: `processOnce` must finish one job before the next.
- Assembling a value that is not one entry per input: `buildBody` in `openai.ts`
  pushes a variable number of prompt turns depending on what context exists, and
  a `.map` cannot express that.
- Where the chain would need a cast or a non-null assertion to tell the compiler
  what the guard already proved. `generateResponsesHtml` in
  `email-connection.strategy.ts` guards on `field.id` being present and then
  indexes `data[fieldId]`; as a `.filter().map()` the compiler loses that and
  wants `field.id as string`. The loop is the honest version. A cast is worse
  than a loop.

## Errors

**Domain errors live in `src/core/errors.ts` and carry no status code.** Each
one names a domain outcome and carries the facts the route needs. `server.ts`
turns it into a status, in one place, in its `setErrorHandler`.

```ts
throw new ValidationError(errors);   // -> 422 { errors }
```

`ValidationError` is the only one so far. Add a second only when a service has
a genuinely new outcome to report, and map it in `setErrorHandler` in the same
change. The status lives there and nowhere else.

**`HttpError` is the old shape and is not for new code.** It bundles a
`statusCode` into the domain layer, which is exactly what rule 14 forbids. Four
services still throw it; they are named under
[Known inconsistencies](#known-inconsistencies) and are migrated when you are
already editing them, not as a drive-by.

**Throw a plain `Error` for a programmer error**, something no request should
ever be able to trigger. It becomes a bare 500.

```ts
throw new Error(`No handler registered for event: ${job.event}`);
throw new Error('Connection delay_minutes must be a non-negative integer');
```

**Message style:** sentence case, no trailing period, a colon before an
interpolated value.

**Catch only for one of two reasons:**

1. To inspect and recover, then rethrow anything unrecognised.

```ts
} catch (error: any) {
  if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
    return null;
  }

  throw error;
}
```

2. To log and continue, where the loop must survive one bad item.

```ts
} catch (error) {
  console.error(`Job ${job.id} failed`, error);
  await this.jobRepository.reschedule(job.id, new Date(now.getTime() + 60_000));
}
```

**`console.error` is the only logging call in application code.** Request logging
comes from Fastify's own `logger: true`. Do not add a logging library.

## Routes

**A route is an exported `RouteOptions` object literal**, with keys in
alphabetical order: `handler`, `method`, `url`. It is not registered with
`fastify.get()` sugar. `server.ts` calls `server.route(NAME)` once per route.

```ts
export const FORMS_ID_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { formService } = await getContainer();

    const form: IDeclarativeForm | null = await formService.findById(
      request.params.id,
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

- **`handler` is an arrow function.**
- **Resolve the container inside the handler body**, never at module scope:
  `const { formService } = await getContainer();`.
- **There is no schema validation library for the HTTP envelope.** No zod, no
  TypeBox, no Fastify `schema` key. Type the request with `FastifyRequest<{
  Body, Params, Querystring }>` generics and hand-roll the runtime guards. Ajv
  exists in this package, but only inside `InternalFormService`, whose private
  `readDefinition` validates an authored form definition against the engine's
  `FORM_JSON_SCHEMA`. The validator is compiled once at module scope in
  `container.ts`. Do not reach for it to validate a request envelope.
- **Guard every `request.query` read with `typeof value === 'string'`.**
  `server.ts` parses query strings with `qs`, so `?branch[$ne]=main` arrives as
  an object. Several of these values reach a Mongo filter.
- **Send, blank line, `return`.** After `reply.status(...).send()` in a guard,
  leave a blank line before the bare `return;`.

**Status codes in use**, and what each means here:

| Code | Meaning                                                             |
| ---- | ------------------------------------------------------------------- |
| 200  | Success, including a successful write                               |
| 400  | A required request part is absent before any lookup happens         |
| 401  | No bearer token, or the token no longer resolves to a caller        |
| 403  | The caller belongs to the organization but lacks the role           |
| 404  | The addressed resource does not exist, or the caller may not see it |
| 409  | The write lost a race, or it targets a protected resource           |
| 422  | The submission or definition failed validation                      |
| 429  | A rate-limited route was exceeded                                   |
| 503  | An authenticated route was called while auth is unconfigured        |

**404 and 403 are not interchangeable.** Return 404 when the caller has no
relationship to the resource, so that ids cannot be probed for existence.
Return 403 only once the caller is known to be a member and is merely missing a
role.

`server.ts` registers a `setErrorHandler`. A thrown error with a `statusCode`
below 500 keeps its status and its message; anything else is logged with
`console.error` and answered with a bare 500 carrying no detail.

**Success sends the raw resource with no envelope:** `reply.status(200).send(form)`.
Three responses are wrapped, and all three are deliberate: `{ url }` from the
upload route, `{ errors }` on a validation failure, and `{ error, ... }` on a
409 conflict, where `error` is a machine-readable slug such as
`revision_conflict`, `branch_exists` or `branch_protected`. Do not introduce a
general response envelope.

**A route does not send user-facing prose.** The client owns localized copy, so
an English `{ message }` in an error body is both a fourth envelope and an i18n
regression: a Spanish respondent is shown English. Send the status with an empty
body and let the client pick its own string. The email challenge routes answer
503, 400, 502 and 422 that way.

**Authenticated routes opt in per route**, never globally, by setting
`preHandler` in the `RouteOptions` literal (keys stay alphabetical: `config`,
`handler`, `method`, `preHandler`, `url`). The public form, submission and file
routes must stay anonymous, so an allowlist-by-omission is exactly how a
management route ends up open.

Two preHandlers compose, and neither throws:

```ts
preHandler: authenticate,                          // sets request.email
preHandler: [authenticate, authorizeOrganization], // also sets request.organization
```

`authorizeOrganization` resolves `:organizationId` and answers 404 when the
caller's email is not in its member list, so a handler that runs has already
had membership proven. Only the admin check remains, via
`organizationService.assertAdmin`.

**Routes do not catch.** A thrown `HttpError` propagates to the
`setErrorHandler` in `server.ts`, which sends its `payload` when it has one and
`{ errors: { '/': message } }` otherwise. Use `try`/`catch` in a route only when
the error drives logic in that route, which nothing does today. A handler is
therefore the happy path plus a single `null` check.

**Rate limits opt in per route too**, via `config.rateLimit`. The plugin is
registered with `global: false`.

**A route that spends money keys its limit on the caller, not the IP.** The two
generation routes set
`keyGenerator: (request) => request.headers.authorization || request.ip`, because
`trustProxy` trusts one hop and Studio adds a second, so `request.ip` collapses
every user into one bucket. Rate limiting runs at `onRequest`, before
`preHandler`, so `request.email` is still `null` and the bearer is the only
per-caller value available. Copy this for any future externally billed route;
every other route keeps the plugin's IP default.

## The container

`src/core/container.ts` is a hand-written service locator. No DI framework.

- **`Container` is a `type` whose fields are listed in dependency order**, not
  alphabetically. It documents the build order.
- **`s3Client` is built eagerly at module scope.** It needs no async work.
- **`getContainer()` is lazy and memoised**, guarded by `if (container) { return
  container; }`.
- **Construct with positional `new X(...)`, in dependency order:** Mongo client
  and db, then gateways, then repositories, then dependency-free services, then
  the strategies array, then services that depend on other services.
- **The returned object literal is alphabetised by key**, in contrast to the
  `Container` type above it. This inversion is intentional and consistent: type
  declarations keep logical order, object literal values are alphabetised.
- **`disposeContainer()` mirrors the same guard style**, closes the Mongo client,
  and resets the singleton to `null`.

To add a dependency: add the field to `Container` at its build position,
construct it in `getContainer()` after everything it needs, and add it to the
returned literal in alphabetical position.

## Formatting

Prettier owns the mechanics. `prettier.config.cjs` sets only
`singleQuote: true`; everything else is the Prettier 3 default, meaning 80
columns, semicolons, trailing commas everywhere, and always-parenthesised arrow
parameters. Run `npm run lint` and let it decide.

What Prettier does not decide, and you must get right by hand:

**Object literal values are alphabetised by key.**

```ts
const command = new PutObjectCommand({
  Body: buffer,
  Bucket: process.env.AWS_S3_BUCKET_NAME as string,
  ContentType: contentType,
  Key: key,
});
```

**Except a discriminant `type`, which comes first:** `{ type: 'created',
submission }`.

**`type` declarations keep logical order, not alphabetical order.** `IJob` is
`id, event, data, run_at` because that is the record's natural reading order.

**Blank lines mark topic boundaries.** This is a strong default, roughly two
thirds of eligible sites, not an absolute:

- Put a blank line after a `const` whose value is then consumed by a statement
  with a different concern, especially before a guard `if`.
- Do not put one before an `if` that is the first statement in its block, right
  after a `{`.
- Do not put one between tightly coupled setup statements. `getContainer()` runs
  ten consecutive `const` lines with no blank lines, because they are one
  operation.

```ts
const form = parse(text);

const id = `${GITHUB_FORM_PREFIX}${md5(`${slug}@${branch}`).substring(0, 8)}`;
```

**Do not introduce a local just to shorten an expression.** Read the property
directly.

```ts
currentId =
  !section.next ||
  section.next === 'done' ||
  section.next.startsWith('https://')
    ? undefined
    : section.next;
```

**A line may exceed 80 columns only when it holds one unbreakable token**, such
as a template literal or a URL. Prettier will not break these, and that is
acceptable.

## Known inconsistencies

Recorded so you neither copy them nor "fix" them as a drive-by. Correct one only
when you are already editing that line for another reason.

- **`server.ts:14`**: `export async function startServer() {` is the only
  function in the package without an explicit return type.
- **Mongo collection names are repeated string literals**: `'jobs'` appears five
  times in `job.repository.ts`, and `'submissions'` and `'github_files'` likewise
  in their repositories. There is no shared constant.
- **Id generation is not centralised.** `randomBytes(8)` for job ids and upload
  keys, `randomBytes(16)` for submission ids, `randomBytes(6)` behind a prefix
  for form, organization and auth-code ids, with no shared helper.
- **`GitHubGateway` has two near-duplicate fetch blocks**, one authenticated and
  one anonymous, with no extracted helper.
- **An absent wildcard segment is not handled uniformly.** `forms-slug-get.ts:17`
  answers 400, while the same condition in `files-key-get.ts:14` answers 404.
- **`server.ts` defines three small routes inline** (`/`, `/api/v1/health`,
  `/api/v1/ping`) rather than in `routes/`. New routes of any substance go in
  `routes/`.
- **`FormMessageRepository`'s pagination index leads with `form_id`, not
  `organization_id`.** `form_id` already determines the organization, so an
  `organization_id` prefix adds no selectivity and only widens every key. The
  organization is enforced in the query filter instead, and both partial unique
  indexes are scoped to `{form_id, branch}` because fork copies keep their
  source's `generation_id`.
- **`FORM_AUTHORING_RULES` in `gateways/openai.ts` restates guidance that also
  lives in `packages/core/public/AGENTS.md`.** It cannot import it: the api image
  copies only `packages/engine` and `packages/api`, and `rootDir` is `src`. The
  constant deliberately carries only the rules the JSON Schema cannot express,
  because `FORM_JSON_SCHEMA` is sent alongside it and its descriptions cover the
  rest. Update the constant when the published authoring guidance changes.
- **`schema_revision` on a message is advisory.** Generation applies with the
  revision filter disabled, so two overlapping turns can both write the same
  revision number, and a message's `schema_revision` may name a revision a later
  turn overwrote. That is the deliberate last-write-wins tradeoff, not a bug.
- **Conversation order is `sequence`, never `created_at`.** Publishing imports
  messages with their original timestamps after appending a marker, so a
  timestamp sort interleaves them wrongly.
- **Four services still throw `HttpError`**, against rule 14:
  `internal-form.service.ts` (ten throws plus a private `revisionConflict`
  factory), `form-message.service.ts`, `organization.service.ts` and
  `authentication.service.ts`. `gateways/openai.ts` builds them too. Until they
  are migrated, two shapes produce a 422 `{ errors }`: `HttpError.invalid()` and
  `ValidationError`. Migrate a file when you are already editing it.
- **`TokenService` is a codec, not a domain service**, and still sits in
  `services/` against rule 15. It is left there because moving it touches OAuth
  state, auth codes and email verification in one change.
- **A final submit missing its verification proof reports the same field
  twice.** The engine marks every `<field-id>_token` field implicitly
  `required`, so `validate` records `errors['<id>_token']` from that rule and
  `errors['<id>']` from the proof check. Harmless: `packages/core` discards the
  422 body and only the status reaches the respondent.

## Before you hand work back

Run these, in this order:

```bash
npm run lint -w @declarativeforms/api     # prettier --write, must report nothing
npm run build -w @declarativeforms/api    # tsc -b, must pass clean
npx tsc -b                                # from the repo root, checks all packages
```

Then check the diff by hand:

```bash
grep -rn "TODO" packages/api/src                       # only TODOs you meant to add
grep -rnE "[A-Za-z_>][[:space:]]*\[\]" packages/api/src  # expect no matches
grep -rn "//" packages/api/src --include="*.ts" | grep -v "https\?://"  # only TODOs
git diff --stat -- packages/api                        # expect no *.test.ts
grep -rnE "\b(Result|Summary|Dto)\b" packages/api/src  # expect no project types
grep -rnE ": Date\b" packages/api/src/core/repositories  # only domain timestamps
grep -rn "IOrganization" packages/api/src/core/services   # only organization.service.ts
grep -rn "for (const" packages/api/src                 # none that only push
grep -rln "HttpError" packages/api/src/core/services   # only the four legacy files
grep -rn "statusCode" packages/api/src/core/services   # only form-message.service.ts
grep -rn "reply\." packages/api/src/core               # expect no matches
grep -rn "getTokenFieldId" packages/api/src            # the only spelling of the suffix
```

And confirm by inspection:

- No comment was added beyond a `// TODO:`.
- Every new type sits in `core/types/` with an `I` prefix, and the barrel is
  still alphabetical.
- Every new environment variable is in `.env.example` and in both `compose.yaml`
  service blocks.
- Every new method has an access modifier and a return type, and private methods
  sit below the public ones.

Do not run `npm test`. It exits 1 because no test files exist, which is the
intended state of this package.
