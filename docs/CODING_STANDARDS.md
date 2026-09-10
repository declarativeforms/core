# RFC: Method and Function Coding Standards

| Field      | Value                                   |
| ---------- | --------------------------------------- |
| Status     | Active                                  |
| Applies to | `packages/api` and `packages/engine`    |
| Subject    | Named TypeScript methods and functions  |
| Audience   | Engineers, reviewers, and coding agents |

## 1. Abstract

This RFC defines how named methods and functions are declared, named,
parameterized, implemented, and consumed in the API and engine packages. Its
purpose is to make a callable's contract understandable from its name,
signature, and return type without reading its implementation or relying on
comments.

The API and engine use different module styles. The API primarily uses classes,
while the engine uses pure exported functions. The shared rules in this RFC
apply to both. Rules concerning access modifiers apply only to concrete class
methods because TypeScript functions and interface method signatures cannot
declare `public` or `private`.

## 2. Status and authority

This RFC is active and normative.

When this RFC conflicts with method- or function-definition guidance in an
`AGENTS.md` file under `packages/api` or `packages/engine`, this RFC takes
precedence for that subject. More specific package rules continue to apply when
they do not conflict with this RFC. Compiler constraints, public API contracts,
security requirements, and data-integrity requirements are never weakened by
this precedence rule.

Existing code that does not conform is legacy code. It MUST NOT be treated as a
pattern to copy. A new named callable MUST conform. An existing named callable
MUST conform when its declaration or behavior is materially changed. Unrelated
legacy callables MUST NOT be refactored solely to satisfy this RFC unless a task
explicitly requests repository-wide alignment.

## 3. Normative language

The terms **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and
**MAY** are normative:

- **MUST**, **MUST NOT**, and **REQUIRED** describe unconditional requirements.
- **SHOULD** and **SHOULD NOT** describe strong defaults. A deviation requires a
  concrete reason arising from the current behavior, not a speculative future
  requirement.
- **MAY** describes an allowed choice, not a requirement.

## 4. Scope

### 4.1 Included callables

This RFC applies to:

- Concrete class methods.
- Static class methods.
- Exported function declarations.
- Non-exported named function declarations.
- Named functions assigned to variables when the function is part of an
  application contract or reusable implementation.
- Method signatures declared by a shared interface.

### 4.2 Excluded callables

This RFC does not require access modifiers or explicit return annotations on:

- Constructors.
- Contextually typed anonymous callbacks passed to `map`, `filter`, `find`,
  `flatMap`, `sort`, promise methods, event APIs, or framework APIs.
- Contextually typed inline arrow functions used as object property values,
  including Fastify route handlers.
- Third-party declarations.

An excluded callback MAY declare a return type when inference is insufficient
or the annotation prevents a real mistake. It MUST NOT be annotated merely for
visual consistency.

## 5. Declaration form

### 5.1 Class method access

Every concrete class method MUST declare exactly one of `public` or `private`.
Implicit public access is forbidden. `protected` is forbidden because it makes
subclass extension part of the contract without exposing that decision to
ordinary callers.

Public methods MUST appear before private methods within a class. Static and
instance methods MAY be interleaved only when keeping a public operation beside
its public static counterpart makes the contract easier to read.

Allowed modifier order is:

```text
public|private -> static, when applicable -> async, when applicable -> name
```

Correct:

```typescript
export class EmailGateway {
  public async send(
    emailAddress: string,
    name: string | null,
  ): Promise<boolean> {
    const response = await this.emailClient.send({
      name,
      to: emailAddress,
    });

    return response.error === null;
  }

  private static normalizeEmailAddress(emailAddress: string): string {
    return emailAddress.trim().toLowerCase();
  }
}
```

Incorrect:

```typescript
export class EmailGateway {
  async send(emailAddress: string): Promise<boolean> {
    return true;
  }

  protected normalizeEmailAddress(emailAddress: string): string {
    return emailAddress.trim().toLowerCase();
  }
}
```

Constructors are not methods for this RFC. A constructor is not required to
declare `public`, but a genuinely private constructor MUST declare `private`
because that modifier changes whether the class can be instantiated.

Interface method signatures cannot declare access modifiers. A class that
fulfills an interface still MUST declare `public` on the concrete method.

### 5.2 Standalone functions

A standalone function MUST use `export` only when it is part of the module's
public surface. It MUST NOT imitate a class access modifier.

Correct:

```typescript
export function resolveLocalizedText(
  input: ILocalizedText | undefined,
  locale: string,
): string {
  return typeof input === "string" ? input : (input?.[locale] ?? "");
}
```

Incorrect:

```typescript
public function resolveLocalizedText(
  input: ILocalizedText | undefined,
  locale: string,
): string {
  return typeof input === 'string' ? input : (input?.[locale] ?? '');
}
```

### 5.3 Explicit return types

Every included callable MUST declare its return type. Type inference does not
replace a declared contract.

- A synchronous procedure MUST return `void`.
- A synchronous value-producing callable MUST return its precise value type.
- An asynchronous procedure MUST return `Promise<void>`.
- An asynchronous value-producing callable MUST return `Promise<T>`.
- A type guard MUST declare a predicate such as `value is IUploadedFile`.
- A safe singular lookup MUST include `null` in its return type.
- A callable returning optional engine data MUST include `undefined` in its
  return type.

The declared return type MUST match every branch. It MUST NOT be widened to
`unknown`, `object`, or a broad union merely to silence a compiler error.

Correct:

```typescript
public findMember(
  organization: IOrganization,
  emailAddress: string,
): IOrganizationMember | null {
  return (
    organization.members.find(
      (member) => member.email === emailAddress,
    ) ?? null
  );
}
```

Incorrect:

```typescript
public findMember(organization: IOrganization, emailAddress: string) {
  return organization.members.find(
    (member) => member.email === emailAddress,
  );
}
```

### 5.4 Use of `async`

The `async` modifier MUST appear immediately before a class method name, after
`public` or `private` and after `static` when present. For function declarations,
`async` MUST appear immediately before `function`.

A callable SHOULD be `async` only when its body:

- Uses `await` to sequence asynchronous work.
- Uses `try`/`catch` around awaited work.
- Must convert a synchronous failure into a rejected promise as part of an
  established asynchronous contract.

A callable that only returns an existing promise SHOULD return that promise
directly without `async`. Removing unnecessary `async` preserves the same
promise contract and avoids implying that the method performs additional
asynchronous orchestration.

Correct:

```typescript
public findById(id: string): Promise<IOrganization | null> {
  return this.organizationRepository.findById(id);
}
```

Correct when sequencing is required:

```typescript
public async publish(id: string, branch: string): Promise<IForm | null> {
  const form = await this.formRepository.findByIdAndBranch(id, branch);

  if (!form) {
    return null;
  }

  return this.formRepository.setPublished(form.id, true);
}
```

Incorrect:

```typescript
public async findById(id: string): Promise<IOrganization | null> {
  return this.organizationRepository.findById(id);
}
```

An interface method returning a promise declares `Promise<T>` but does not use
`async`, because interface signatures have no implementation.

## 6. Naming

### 6.1 Caller-oriented naming

A method or function name MUST state the action it performs or the value it
derives. A caller who knows only the containing class or module, the name, the
parameters, and the return type MUST be able to predict the relevant behavior.

Names MUST describe the externally observable contract rather than internal
steps. A change from MongoDB to another persistence system, or from one HTTP
client to another, SHOULD NOT require a service method rename.

A name MUST NOT:

- Use vague verbs such as `do`, `execute`, `processData`, `handleThing`, or
  `manage` when a precise action exists.
- Describe an implementation detail that callers do not need to know.
- Claim a stronger outcome than the return contract guarantees.
- Hide collection cardinality.
- Depend on a comment to explain what is found, created, changed, or returned.
- Repeat the containing class's concept without distinguishing another concept.

For example, `FormRepository.findById` is preferable to
`FormRepository.findFormById`; the class already supplies the word `Form`.

This contextual naming rule also applies to criteria and parameters. The
owning concept MUST be omitted when it merely repeats the class context:
`FormRepository.findAllBranchNamesById(id)` is preferable to
`findAllBranchNamesByFormId(formId)`. The concept MUST remain when it identifies
a different entity, distinguishes multiple identifiers in the same signature,
or prevents genuine ambiguity. For example, a submission repository may use
`findByFormIdAndSubmissionId(formId, submissionId)` because both identifiers are
required to describe the stored lookup.

### 6.2 Common semantic prefixes

Use these prefixes consistently:

| Prefix             | Meaning                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| `find`             | Search for a value that may be absent.                                 |
| `findAll`          | Search for a complete collection and return an array.                  |
| `list`             | Expose a service-level collection operation.                           |
| `get`              | Compute or retrieve a value whose absence is not a normal result.      |
| `is`, `has`, `can` | Return a boolean predicate without mutating state.                     |
| `create`           | Perform a domain creation action.                                      |
| `insert`           | Persist a new stored value.                                            |
| `upsert`           | Insert a stored value or replace it when the key already exists.       |
| `replace`          | Replace the complete stored representation.                            |
| `update`           | Change a partial stored representation.                                |
| `setX`             | Atomically assign one named persisted property or closely coupled set. |
| `delete`           | Remove a stored value.                                                 |
| `parse`, `read`    | Convert or interpret input without persisting it.                      |
| `toX`, `buildX`    | Produce a value locally without an external side effect.               |
| `assertX`          | Verify an invariant and terminate with `Error` when it is false.       |

`get` MUST NOT return `null` for routine absence. Use `find` when absence is a
normal result. `assertX` MUST NOT be used for ordinary user choices or business
branches; it is reserved for terminal invariants.

### 6.3 Boolean names

A side-effect-free boolean query SHOULD begin with `is`, `has`, or `can`.
Examples include `isConfigured`, `hasAccess`, and `canPublish`.

A command that performs work and returns whether it succeeded MUST retain its
action verb. `send(): boolean` is correct; `isSent()` would falsely imply a
query. A boolean name MUST NOT be negated when a positive form is clear.

### 6.4 Acronyms and terminology

Identifiers MUST use established project terminology. Acronyms are treated as
words in camelCase and PascalCase: `id`, `formId`, `url`, `previewUrl`, `html`,
`json`, `yaml`, and `api`. Product names retain their official casing, such as
`GitHub`.

Parameters MUST use the full domain term when a shorter word would be
ambiguous. For example, use `emailAddress` for an address, `contentType` for a
media type, and `organizationId` for an organization identifier. A parameter
MUST NOT be named `data`, `value`, `item`, or `input` when the callable can name
the domain concept more precisely. These general names remain valid when the
contract genuinely accepts arbitrary data or an opaque value.

## 7. Layer-specific vocabulary

### 7.1 Service methods

A service method MUST use business or domain terminology. It MUST describe what
the application does for its caller, not how a database, queue, HTTP client, or
vendor implements the action.

Valid service command names include `publish`, `unpublish`, `schedule`,
`verify`, `consume`, `addMember`, and `removeMember`.

A service method MUST NOT use persistence mechanics such as `insertOne`,
`updateMany`, `replaceDocument`, or `runAggregation`. It MUST NOT expose HTTP
terms such as `sendResponse`, `returnNotFound`, or `handlePost`.

Service reads use the following vocabulary:

| Contract                                  | Required pattern | Example                      |
| ----------------------------------------- | ---------------- | ---------------------------- |
| Canonical singular lookup                 | `find`           | `find(id)`                   |
| Explicit singular criterion               | `findByX`        | `findByUser(emailAddress)`   |
| Complete unfiltered collection            | `listAll`        | `listAll()`                  |
| Complete filtered collection              | `listByX`        | `listByMember(emailAddress)` |
| Paginated, bounded, or search-style query | `list`           | `list(cursor, limit)`        |

Bare `find` is allowed only when the service has one obvious canonical lookup.
`findById` is allowed when making the criterion explicit prevents ambiguity.
The same service MUST NOT expose equivalent `find` and `findById` methods.

`listAll` means complete. A method MUST NOT use `listAll` if it applies a hidden
limit, cursor, page size, or truncation. A filtered complete collection uses
`listByX`, not `listAllByX`. A paginated or otherwise intentionally bounded
collection uses `list`, and its parameters or return type MUST expose the
pagination contract.

A service MAY proxy a repository collection read only when the service is the
correct public domain boundary. The service still uses `list...`, while the
repository uses `findAll...`.

### 7.2 Repository methods

A repository method MUST use persistence-oriented terminology and MUST expose
the stored criteria relevant to its caller. It MUST NOT decide business policy
or use business command verbs for storage mutations.

Singular reads use:

- `find` for the repository's one obvious canonical identity.
- `findByX` for one explicit criterion.
- `findByXAndY` for multiple required criteria in parameter order.

Collection reads use:

- `findAll` for an unfiltered complete collection.
- `findAllByX` for entities filtered by one criterion.
- `findAllByXAndY` for entities filtered by multiple criteria.
- `findAll<Field>ByX` when returning a scalar or projected collection rather
  than complete entities.

Examples:

```typescript
public findById(id: string): Promise<IOrganization | null> {
  return this.collection.findOne({ id }, { projection: { _id: 0 } });
}

public findAllByMember(
  emailAddress: string,
): Promise<Array<IOrganization>> {
  return this.collection
    .find({ 'members.email': emailAddress }, { projection: { _id: 0 } })
    .toArray();
}

public async findAllBranchNamesById(
  id: string,
): Promise<Array<string>> {
  const forms = await this.collection
    .find({ form_id: id }, { projection: { _id: 0, branch: 1 } })
    .toArray();

  return forms.map((form) => form.branch);
}
```

`findAnyX`, `lookup`, `query`, and `search` MUST NOT replace the established
patterns when the actual criteria can be named. A repository MUST NOT expose
equivalent `find` and `findById` methods.

Entity-write action vocabulary is restricted to:

- `insert` for a new stored representation.
- `upsert` for an insert-or-replace operation selected by a stored key.
- `replace` for a complete stored representation.
- `update` for a partial stored representation.
- `setX` for an atomic assignment whose property is named by `X`.
- `delete` for removal.

The method MAY add a criterion or cardinality suffix, but MUST NOT introduce a
different action verb. `upsert` MUST be used when the persistence operation can
both create and replace; `replace` MUST NOT conceal that behavior. For example,
`deleteById`, `deleteAllByBranch`, and `setStatus` retain the approved action
vocabulary. Names such as `publish`, `complete`, `fail`, `rename`, `consume`,
and `allocate` are forbidden for entity writes; the corresponding service owns
that business meaning.

Administrative repository methods such as index initialization are not entity
writes. Their names MAY state the exact persistence maintenance operation when
that operation is part of application startup.

### 7.3 Gateway methods

A gateway method MUST name the remote capability it invokes. It MAY contain
technical terminology because the gateway is the integration boundary, but the
name MUST remain independent of the chosen client library.

Preferred capability verbs include `get`, `find`, `send`, `verify`, and
`generate`. Examples include `getAccessToken`, `findUser`,
`sendVerificationCode`, and `verify`.

A gateway name MUST NOT expose incidental request mechanics such as
`makeFetchCall`, `sendPostRequest`, or `parseVendorJson`. Those names MAY be used
for private helpers only when they precisely describe reusable internal work.

### 7.4 Strategy methods

A strategy method MUST use the vocabulary of the contract it fulfills. Every
implementation of the same strategy contract MUST expose the same public method
names and return meanings. A strategy MUST NOT rename a gateway capability only
to make the strategy appear domain-oriented.

Private strategy helpers follow the general caller-oriented naming rules. The
strategy implementation is their caller.

### 7.5 Engine functions

Engine functions have no access modifiers. They MUST use named function
declarations and explicit return types. Exported functions SHOULD use the
pipeline vocabulary already established by the package: `parse`, `serialize`,
`resolve`, `compile`, `render`, and `validate`.

Supporting functions MUST identify the produced or inspected value, such as
`resolveFormField`, `compileConnection`, `findPreviousSectionId`, or
`isDeclarativeFieldType`. A stage name alone is reserved for the public function
that performs that complete pipeline stage.

Engine functions MUST remain pure. They MUST NOT perform I/O, read environment
variables, log, mutate their parameters, or depend on API package classes.

## 8. Parameters

### 8.1 Parameter names

Every parameter name MUST explain its role at the call site. The caller SHOULD
not need to open the implementation to distinguish two parameters of the same
primitive type.

Correct:

```typescript
public verifyProof(
  formId: string,
  fieldId: string,
  fieldValue: string,
  token: unknown,
): boolean {
  return true;
}
```

Incorrect:

```typescript
public verifyProof(a: string, b: string, value: string, data: unknown): boolean {
  return true;
}
```

A repository parameter SHOULD use the camelCase form of the persisted criterion.
For example, the stored field `organization_id` is passed as `organizationId`.
The method name SHOULD name the criterion without repeating the repository's
entity.

### 8.2 Hierarchical order

Parameters MUST be ordered from broadest context to narrowest target, then from
the primary operation input to secondary controls:

1. Parent ownership or tenant context, such as `organizationId`.
2. Actor or execution context, such as `emailAddress` or `userId`, when it is a
   direct method input.
3. Target aggregate or entity identifier, such as `formId`.
4. Child resource or subordinate locator, such as `branch` or `fieldId`.
5. Primary payload or value being acted upon.
6. Required behavioral controls.
7. Nullable controls.
8. Defaulted controls.
9. Optional controls declared with `?`.

Hierarchy takes precedence over optionality between different levels. Within
the same level, required parameters precede nullable, defaulted, and optional
parameters.

Correct:

```typescript
public update(
  organizationId: string,
  actorEmailAddress: string,
  formId: string,
  branch: string,
  definition: IDeclarativeForm,
  expectedRevision: number | null,
): Promise<IInternalForm | null> {
  return this.formRepository.update(
    organizationId,
    actorEmailAddress,
    formId,
    branch,
    definition,
    expectedRevision,
  );
}
```

An optional value in the middle of a hierarchy SHOULD be represented as a
required nullable parameter when callers must make the absence explicit. A
syntactically optional `?` parameter MUST NOT be followed by a required
parameter.

### 8.3 Optionality

The signature MUST distinguish these contracts:

- `value: T` means the caller must provide a value.
- `value: T | null` means the caller must explicitly provide either a value or
  the domain's empty sentinel.
- `value?: T` means the caller may omit the argument.
- `value = defaultValue` means omission selects a stable default.
- `value: T | undefined` is allowed only when the position itself is required or
  an upstream type explicitly supplies `undefined`.

Do not combine `?`, `| null`, `| undefined`, and a default unless each state has
a distinct required meaning. A default MUST represent a genuine contract
default, not hide missing required input.

### 8.4 Positional parameters and option objects

Use positional parameters while their order and meaning remain obvious. A new
options object MUST NOT be introduced only to reduce the visual length of a
signature.

An options object is justified when:

- The options form a named domain concept.
- Most options are independently optional.
- Callers would otherwise pass several adjacent booleans or nullable primitive
  values whose meaning is unclear.
- The object is already an established cross-layer contract.

An options type used by one simple method MUST remain inline unless naming it
communicates a genuine reusable concept. Do not create speculative parameter
objects for future fields.

### 8.5 Boolean parameters

A boolean parameter MUST describe the true state positively, such as
`deleteSource` or `includeResponses`. Avoid names such as `flag`, `enabled`, or
`skip` when the affected behavior is not named.

Adjacent boolean parameters SHOULD be replaced by a literal union or a genuine
options object if a caller cannot understand calls such as `publish(id, true,
false)` without reading the declaration.

### 8.6 Entity versus identifier parameters

A service SHOULD accept an identifier when it needs only identity and can load
the entity itself. It SHOULD accept the entity when the caller has already
established it and the method requires several of its fields. A repository write
SHOULD accept the stored entity or the exact persisted fields needed by the
operation.

A method MUST NOT accept both an entity and its identifier when the identifier
can be read from the entity, unless the two identifiers intentionally refer to
different scopes and their names make that distinction explicit.

## 9. Return contracts

### 9.1 Direct domain values

A callable MUST return the simplest direct value that communicates its contract.
Allowed return categories are:

- A domain entity.
- A domain projection, including an inline `Pick`.
- A primitive.
- A string-literal union representing a genuine domain value that current
  domain behavior consumes.
- An array of domain values.
- `null` or `undefined` with the meanings defined below.
- `void` when the caller needs no value.
- A genuine page contract when cursor or pagination metadata is inherently part
  of the collection response.

A return type MUST NOT wrap one value merely to name the operation. Return
`boolean`, not `{ sent: boolean }`; return the entity, not `{ organization }`.

### 9.2 Result types are forbidden

A callable MUST NOT introduce a result, response, outcome, summary, or DTO type
whose only purpose is to wrap the success or failure of that callable.

Forbidden examples include:

```typescript
type EmailSentResult = {
  error: string | null;
  sent: boolean;
};

type UpdateOrganizationOutcome = {
  organization: IOrganization | null;
  status: "conflict" | "updated";
};
```

Inline success/error wrappers are also forbidden:

```typescript
public send(emailAddress: string): Promise<{
  error: string | null;
  success: boolean;
}> {
  return Promise.resolve({ error: null, success: true });
}
```

A shared entity, established cross-layer contract, or genuine cursor page is
not a result type merely because a method returns it. The distinction is whether
the type models durable domain data or only encodes one call's control flow.

A callable MUST NOT add `false`, validation issues, status literals, or another
failure-only union member merely so a caller or route can select a more specific
error response. The normal contract is the successful domain value with its
natural absence value. A richer outcome is allowed only when a current,
explicit product workflow consumes that distinction as domain behavior rather
than transport categorization.

### 9.3 `null`

Within the API, `null` means a safe, expected absence or non-result for a
singular domain operation. Repository and service `find...` methods MUST return
`null` when no matching entity exists. A command MAY return `null` when its
caller can safely treat multiple ordinary non-results identically and no
current product behavior requires their causes to be distinguished.

`null` MAY also represent an explicit empty sentinel when the caller must
distinguish emptiness from omission. It MUST NOT be returned for an unexpected
infrastructure failure.

### 9.4 `undefined`

Within the engine, `undefined` means an optional or omitted authored value.
Functions MAY return `undefined` when no optional bound, validation message,
navigation target, or authored property exists.

The API MUST prefer `null` for a safe singular search result. The engine MUST
reserve `null` for a deliberate explicit empty sentinel and MUST NOT exchange
`null` and `undefined` solely for consistency with the API.

### 9.5 Collections

A collection read MUST return `Array<T>`, never `null` and never `undefined`.
No matches MUST produce an empty array. The return type and method name MUST make
collection cardinality visible.

A method MUST NOT throw because a collection is empty. Empty collections are
ordinary values.

### 9.6 Boolean results

Use `boolean` when the caller needs only a yes/no outcome as part of the domain
contract. `false` MUST represent an expected negative result, not a hidden
exception or a route-specific error category.

Examples of appropriate boolean contracts include a predicate, an optional
remote verification, or an action whose current caller must branch on whether
it was performed. If the caller requires the changed domain value, return that
value instead. If no caller branches on the value, return `void`.

### 9.7 Repository write results

Repository writes MUST return only the information a current caller needs:

- Return `void` when callers need only completion or a thrown terminal failure.
- Return `boolean` when callers must distinguish whether a target was changed.
- Return a count when callers need the number of affected records.
- Return the stored entity only when callers immediately need its stored state.
- Return `null` with an entity result when no matching target is an expected
  outcome.

A repository MUST NOT perform an additional read only to manufacture a richer
write result. When the database operation already returns the required entity,
the repository MAY return it directly.

A repository write MUST NOT return a driver result, acknowledged flag, raw
document containing `_id`, or persistence response envelope. It MUST translate
driver metadata into the direct caller-needed value and MUST NOT add a parallel
result or success wrapper.

## 10. Implementation structure

### 10.1 Guard clauses

Expected negative branches SHOULD return early. The happy path SHOULD remain at
the lowest indentation level. Every control-flow block MUST use braces.

Correct:

```typescript
public findById(id: string): Promise<IOrganization | null> {
  if (!id) {
    return null;
  }

  return this.organizationRepository.findById(id);
}
```

Incorrect:

```typescript
public async findById(id: string): Promise<IOrganization | null> {
  if (id) {
    return this.organizationRepository.findById(id);
  } else {
    return null;
  }
}
```

### 10.2 Blank lines

Blank lines separate logical stages, not individual statements. A callable
SHOULD use one blank line between:

- Input normalization and validation.
- Validation and an early-return guard.
- Loading data and deciding what to do with it.
- Distinct dependency calls.
- A completed setup block and the final returned expression.

Do not put a blank line immediately after an opening brace or immediately before
a closing brace. Do not separate a declaration from a tightly coupled statement
that completes the same operation. Do not use multiple consecutive blank lines
inside a callable.

Correct:

```typescript
public async verify(
  emailAddress: string,
  code: string,
): Promise<boolean> {
  const normalizedEmailAddress = emailAddress.trim().toLowerCase();

  if (!normalizedEmailAddress || !code) {
    return false;
  }

  return this.emailGateway.verify(normalizedEmailAddress, code);
}
```

### 10.3 Local variables

A callable SHOULD use a parameter directly when it is read once and the direct
expression remains clear. It MUST NOT create an alias that merely shortens or
renames a parameter.

A local variable is justified when it:

- Reuses a computed value.
- Prevents repeating an expensive or side-effecting operation.
- Preserves a runtime type narrowing.
- Names an important intermediate domain decision.
- Separates logical stages of the operation.
- Holds a local accumulator.
- Prevents mutation of a parameter.

Correct direct use:

```typescript
public delete(id: string): Promise<IOrganization | null> {
  return this.organizationRepository.delete(id);
}
```

Incorrect alias:

```typescript
public delete(id: string): Promise<IOrganization | null> {
  const organizationId = id;

  return this.organizationRepository.delete(organizationId);
}
```

Correct derived value:

```typescript
public buildAuthorizationUrl(redirectUri: string): string {
  const normalizedRedirectUri = redirectUri.trim();

  return this.gitHubGateway.buildAuthorizationUrl(normalizedRedirectUri);
}
```

### 10.4 Parameter mutation

A callable MUST NOT mutate a parameter. It MUST create a local value or a new
object when transformation is required. Engine functions MUST be pure; API
methods SHOULD also avoid hidden mutation so the caller retains ownership of
objects it passes.

A Fastify authentication or authorization hook MAY assign a value to a request
property that was explicitly registered with `decorateRequest` and declared by
the API's Fastify type augmentation. This exception is limited to request-scoped
context such as the authenticated email address or authorized organization. It
MUST NOT mutate request body, parameters, query values, headers, or undeclared
properties.

### 10.5 Comments

A method or function declaration and body MUST NOT contain comments. This
includes explanatory comments, JSDoc, block comments, inline comments, TODOs,
compiler directives, and tooling directives.

When a comment appears necessary:

- Rename the callable or parameter.
- Extract a small, named private method or local function only when it is reused
  or materially clarifies a distinct operation.
- Introduce a named constant for an otherwise unexplained literal.
- Simplify the control flow.

Do not extract a one-line helper merely to avoid a comment when a direct
expression is already clear.

### 10.6 Formatting

Prettier owns line wrapping, indentation, quote style, commas, and semicolons.
Code MUST be written so that formatting it does not change its meaning. Manual
alignment with additional spaces is forbidden.

The declaration MUST remain readable after Prettier formats it. A multi-line
signature SHOULD place one parameter per line and retain the trailing comma
produced by the project formatter.

## 11. Error and outcome policy

### 11.1 Errors do not drive expected logic

An error MUST NOT represent an expected branch that permits the caller to
continue normally. Callers MUST NOT inspect an error class, message, status,
code, or payload to choose a business path.

Expected outcomes use direct return values:

| Outcome                                                 | Return                 |
| ------------------------------------------------------- | ---------------------- |
| Singular value not found                                | `null`                 |
| Collection has no matches                               | `[]`                   |
| Domain predicate or recoverable yes/no operation is negative | `false`           |
| Optional engine value is absent                         | `undefined`            |
| Changed entity is unavailable because no target matched | `null`                 |
| Current workflow consumes a meaningful finite value set | A direct literal union |

A caller MAY branch on these values. That branch is normal control flow.

Validation failures, conflicts, and dependency failures MUST NOT become extra
return variants solely to let an API route distinguish `409`, `422`, `429`, or
`503`. Until a product requirement defines a recoverable workflow for one of
those cases, the operation has no happy-path continuation and MAY throw a plain
`Error`; the shared API error handler then produces the generic `500` response.
Do not preserve speculative distinctions for possible future clients.

### 11.2 Terminal failures

A method or function MAY explicitly throw only when the current operation
cannot continue on a valid happy path. Examples include:

- A violated internal invariant.
- Corrupt state that makes a result unsafe.
- Missing mandatory configuration for a required capability.
- Invalid data at a trust boundary when the callable's contract cannot express
  a safe continuation.
- Domain validation or conflicting state for which no current product workflow
  defines a recoverable branch.
- A required dependency failure for which no degraded behavior exists.

An explicit terminal failure MUST use plain native `Error`:

```typescript
throw new Error("Cannot publish a form without a main branch.");
```

New custom error classes are forbidden. A method MUST NOT construct or throw an
HTTP error, domain error, repository error, gateway error, or result-like error
payload. Error messages are diagnostic text, not machine-readable contracts.

### 11.3 Natural propagation

Unexpected failures from dependencies SHOULD propagate naturally. A method
MUST NOT catch an unexpected exception merely to replace it with `null`,
`false`, or an empty array. Those values mean expected outcomes and must not
hide outages, timeouts, corruption, programmer mistakes, or driver failures.

A caught unexpected error MAY be rethrown unchanged:

```typescript
try {
  return await operation();
} catch (error) {
  await cleanup();

  throw error;
}
```

This does not violate the native `Error` rule because the method does not create
a new error contract. It preserves the original unexpected failure.

A method SHOULD NOT catch and immediately rethrow without performing required
cleanup, recording an operational failure, or translating an explicitly
recoverable integration outcome.

### 11.4 Repository failures

A repository MUST return absence only for expected storage outcomes:

- A singular query matched no document.
- A collection query matched no documents.
- A write matched no target.

Connection errors, authentication errors, timeouts, malformed driver responses,
and other unexpected database failures MUST propagate. A repository MUST NOT
make an outage indistinguishable from an empty database.

A known storage collision MAY be translated to `null` only when collision is an
explicit expected part of the repository method's return contract. The service,
not the repository, determines the business meaning of that absence.

### 11.5 Gateway failures

A gateway returns `null` or `false` only when remote absence or rejection is an
established part of the capability and its caller can continue safely. Examples
include an unknown remote user or an invalid verification token. Missing
configuration for a capability the current operation requires is a terminal
failure, not an additional return variant.

A gateway allows an unexpected failure to propagate when continuing would be
unsafe or would falsely report success. If it must create a terminal failure,
it uses plain `Error`.

The choice between a safe value and an error is part of the gateway method's
contract. A gateway MUST NOT return `false` for one infrastructure failure and
throw for the same failure on another execution path.

### 11.6 Service failures

A service returns a direct domain value for an expected business outcome the
caller can handle. It throws plain `Error` only when the requested operation has
no valid continuation.

A service MUST default to its success value plus the natural `null` or empty
collection result. It MUST NOT expose validation arrays, conflict booleans, or
failure status literals merely to give a route a more specific HTTP status.
Detailed validation issues MAY cross the boundary only when an explicit current
workflow consumes them, such as an internal automatic repair pass.

A service MUST NOT use an exception as an alternate return channel. It MUST NOT
catch a repository or gateway exception and convert it to a business decision
unless the dependency contract explicitly defines that failure as recoverable.

### 11.7 Engine failures

An engine function returns `null`, `undefined`, `false`, or another direct value
only when that value is part of its pure transformation contract. It MAY throw
plain `Error` for an invalid invariant that prevents a safe transformation.

Engine functions MUST NOT define custom error classes or attach transport,
repository, or HTTP metadata to an error.

## 12. Complete examples

### 12.1 Gateway method

```typescript
export class EmailGateway {
  public async send(
    emailAddress: string,
    name: string | null,
  ): Promise<boolean> {
    const response = await this.client.send({
      name,
      to: emailAddress,
    });

    return response.error === null;
  }
}
```

The declaration is public, asynchronous because it awaits work, explicitly
typed, directly named for its remote capability, and returns a recoverable
boolean without a result wrapper.

### 12.2 Service and repository collection

```typescript
export class OrganizationService {
  constructor(private organizationRepository: OrganizationRepository) {}

  public listByMember(emailAddress: string): Promise<Array<IOrganization>> {
    return this.organizationRepository.findAllByMember(emailAddress);
  }
}

export class OrganizationRepository {
  constructor(private collection: Collection<IOrganization>) {}

  public findAllByMember(emailAddress: string): Promise<Array<IOrganization>> {
    return this.collection
      .find({ "members.email": emailAddress }, { projection: { _id: 0 } })
      .toArray();
  }
}
```

The service uses domain collection vocabulary. The repository uses persistence
collection vocabulary. Both promise an empty array when no organization
matches.

### 12.3 Repository write

```typescript
export class OrganizationRepository {
  constructor(private collection: Collection<IOrganization>) {}

  public async setMemberRole(
    organizationId: string,
    emailAddress: string,
    role: IOrganizationRole,
  ): Promise<boolean> {
    const result = await this.collection.updateOne(
      { id: organizationId, "members.email": emailAddress },
      { $set: { "members.$.role": role } },
    );

    return result.matchedCount > 0;
  }
}
```

The name states the persisted property, the parameters follow hierarchy, and
the return value provides exactly the existence signal its caller needs without
an additional read or a result wrapper.

### 12.4 Engine function

```typescript
export function findPreviousSectionId(
  form: ICompiledForm,
  activeSectionId: string,
): string | undefined {
  const activeSectionIndex = form.sections.findIndex(
    (section) => section.id === activeSectionId,
  );

  if (activeSectionIndex <= 0) {
    return undefined;
  }

  return form.sections[activeSectionIndex - 1]?.id;
}
```

The function has no access modifier, declares its optional return, remains pure,
and uses blank lines to separate lookup, guard, and result.

### 12.5 Forbidden control-flow result

```typescript
type EmailSentResult = {
  error: Error | null;
  sent: boolean;
};

export class EmailGateway {
  public async send(emailAddress: string): Promise<EmailSentResult> {
    try {
      await this.client.send({ to: emailAddress });

      return { error: null, sent: true };
    } catch (error) {
      return { error: error as Error, sent: false };
    }
  }
}
```

This is forbidden because it creates a result type, returns an error as data,
and hides every dependency failure as an ordinary negative result.

## 13. Review checklist

Before accepting a new or changed named method or function, verify all of the
following:

### Declaration

- A concrete class method declares `public` or `private`.
- No concrete class method declares `protected`.
- Modifiers appear in the required order.
- `async` is present only when its implementation needs it.
- The return type is explicit and covers every branch.
- Constructors and contextual anonymous callbacks have not gained unnecessary
  annotations.

### Naming

- The caller can predict the relevant behavior without reading the body.
- The name states an action, capability, predicate, conversion, or lookup.
- Cardinality and lookup criteria are visible.
- Names and parameters do not repeat the owning class concept unless needed to
  distinguish another entity or multiple identifiers.
- Service names use domain vocabulary.
- Repository names use the required read and fixed write vocabularies.
- Insert-or-replace persistence operations use `upsert`, not `replace`.
- Gateway names expose remote capabilities rather than client mechanics.
- Engine names identify their pipeline stage and subject.

### Parameters

- Every parameter has a self-explanatory domain name.
- Parameters are ordered from parent context to child target, then payload and
  controls.
- Required values precede nullable, defaulted, and optional values within the
  same hierarchy level.
- Optionality has one precise representation and meaning.
- No identifier duplicates information already present in an entity parameter.
- An options object exists only for a genuine grouped concept.

### Returns and errors

- The callable returns a direct domain value.
- No one-method result, outcome, response, summary, or DTO wrapper was added.
- Singular API absence is `null`.
- Collection absence is an empty array.
- Optional engine absence is `undefined`.
- Repository writes return only the direct value current callers need.
- No failure-only boolean, validation array, or status union exists merely to
  select an HTTP error response.
- Safe expected absence and negative predicates do not throw.
- Explicit terminal failures use plain `Error`.
- No caller must inspect an error to make a business decision.
- Unexpected dependency failures are not hidden as absence.

### Body

- Guard clauses keep the happy path shallow.
- Braces surround every control-flow block.
- Blank lines separate logical stages without fragmenting coupled statements.
- No local merely aliases a parameter.
- Every local materially improves reuse, narrowing, safety, or clarity.
- Parameters are not mutated except for declared Fastify request context.
- The declaration and body contain no comments.
- Prettier owns mechanical formatting.

## 14. Conformance boundary

Conformance is evaluated on each new or materially changed named callable. A
change is conforming only when its declaration, name, parameters, return
contract, body structure, and error behavior satisfy every applicable MUST or
MUST NOT rule in this RFC.

When modifying the API, verification MUST include:

```bash
npm run lint -w @declarativeforms/api
npm run build -w @declarativeforms/api
npx tsc -b
```

When modifying the engine, verification MUST include:

```bash
npm run lint -w @declarativeforms/engine
npm run build -w @declarativeforms/engine
npx tsc -b
```

The lint commands format files in place. A second lint run MUST report no
changed source files. Reviewers MUST additionally inspect the changed callable
against the checklist because naming quality, expected-versus-terminal outcomes,
unnecessary locals, and comment-free clarity cannot be established by the type
checker or formatter alone.

This RFC does not authorize compatibility aliases, migrations, broad cleanup,
or unrelated refactoring. When a requested change exposes a legacy
non-conforming callable, make the smallest safe alignment necessary for the
requested behavior. Leave unrelated legacy code unchanged.

This RFC defines method and function standards only. It does not redefine route
URLs, HTTP response shapes, package architecture, persistence schemas, public
engine types, test policy, or dependency policy except where those subjects
directly determine a callable's name, signature, return contract, or error
behavior.
