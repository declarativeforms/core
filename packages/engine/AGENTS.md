# packages/engine: coding standards

This file describes how code in `packages/engine` is written. It is not
aspirational. Every rule below is already true of the code in `src`, and each one
cites a file that demonstrates it.

If this file and the code disagree, the code is wrong. Fix the code, then keep
this file accurate.

This package is the shared library. `packages/api` and `packages/core` both
depend on it and neither is allowed to depend on the other, so a change here
reaches every surface. It is also the strictest package in the repo: no classes,
no `any`, no comments, no tests, no I/O.

This is an internal engineering document. It has nothing to do with
`packages/core/public/AGENTS.md`, which is a published product asset that teaches
external agents to author YAML forms.

## Contents

- [The non-negotiables](#the-non-negotiables)
- [Layout](#layout)
- [Comments](#comments)
- [Tests](#tests)
- [Module style](#module-style)
- [Naming](#naming)
- [Types](#types)
- [Imports](#imports)
- [Function signatures](#function-signatures)
- [Control flow](#control-flow)
- [Purity and immutability](#purity-and-immutability)
- [Formatting](#formatting)
- [Known inconsistencies](#known-inconsistencies)
- [Before you hand work back](#before-you-hand-work-back)

## The non-negotiables

Break any of these and the change is wrong, regardless of whether it compiles.

1. **No comments.** Not one, anywhere in `src`.
2. **No test files.** This package ships without tests.
3. **No classes.** Pure exported functions only.
4. **`Array<T>` and `ReadonlyArray<T>`. Never `T[]`.**
5. **No `any`.** The package contains zero occurrences. Keep it that way.
6. **Explicit return type on every function**, exported or not.
7. **Braces on every block.** No single-line `if (x) return y;`.
8. **No side effects.** No I/O, no `process.env`, no `console`, nothing at module
   scope but pure declarations.

## Layout

Six folders under `src`, plus two root files. Treat this as a naming and import
map:

| Path            | Holds                                                    |
| --------------- | -------------------------------------------------------- |
| `parse/`        | YAML text to the authored form shape                     |
| `resolve/`      | localization of authored text                            |
| `compile/`      | applying answers, plus the expression and template DSLs  |
| `render/`       | projecting a compiled form into a view                   |
| `validate/`     | field validation                                         |
| `types/`        | every type, in four families: `schema`, `resolved`, `compiled`, `render` |
| `index.ts`      | the package's entire public surface                      |
| `json-schema.ts` | the published JSON Schema, at the root and unfoldered   |

**Barrels.** `compile/`, `resolve/`, `render/`, `validate/`, `types/`,
`types/schema/` and `types/render/` each have an `index.ts`. Two deliberate
exceptions, neither of which is an oversight to correct:

- **`parse/index.ts` is the implementation of `parse()`**, not a barrel. It is
  the only file in its folder.
- **`json-schema.ts` sits at the root** rather than in a folder of its own.

`index.ts` is the only file that may name the whole public surface. Everything a
consumer can reach is listed there explicitly.

## Comments

**Write no comments.** The package contains zero: no JSDoc, no block comments, no
line comments. That is deliberate and it is enforced by review, not by a tool.

This is stricter than it looks, because it applies to exported functions and
exported types too. The library documents itself through names and type
signatures, not prose.

If you feel the need to explain something, change the code instead:

- Rename the function, parameter or type so the name carries the explanation.
- Extract a named helper whose name states the intent.
- Introduce a named constant instead of a literal.

**Two narrow exceptions:**

1. `// TODO: <imperative instruction>` describing a concrete refactor of the code
   directly beneath it. There are none in the package today. Do not write
   `// TODO: revisit` or `// TODO: might be slow`. If you cannot state the action
   and its target, do not write the TODO.
2. **Genuine compiler and tooling directives**, such as `@ts-expect-error` or
   `prettier-ignore`. There are none today. If you need one, the directive is the
   comment: do not add prose around it.

## Tests

**This package has no tests, and you should not add any.** Do not create
`*.test.ts` files, do not add a test framework, do not add fixtures.

Unlike `packages/api`, engine has never had a `test` script or a jest config, so
there is no dormant tooling here to trip over. Verification is the type checker
plus the build-time assertions that already exist downstream. See
[Before you hand work back](#before-you-hand-work-back).

## Module style

**Pure exported functions. No classes.** There are 0 classes and 39
`export function` declarations.

**Two of these are compiler-enforced, not preferences.**
`packages/engine/tsconfig.json` sets `erasableSyntaxOnly: true`, which forbids
any syntax a type-stripping transpiler cannot erase:

- **No `enum`.** Use a `const` tuple plus a derived union, the way
  `types/schema/field-type.ts` does.
- **No `namespace`, no decorators, and no constructor parameter properties.** The
  `constructor(private db: Db) {}` pattern that `packages/api` uses everywhere is
  a compile error here. Do not copy api's class idioms into this package.

**Declare functions with the `function` keyword.** There are zero
arrow-function exports. All four `export const`s are data, never functions:
`FORM_JSON_SCHEMA`, `DECLARATIVE_FIELD_TYPES`, `DECLARATIVE_CONNECTION_TYPES`,
`DEFAULT_MESSAGES`.

**One exported function per file**, with two accepted exceptions: `compile/next.ts`
exports two, and `render/field-metadata.ts` is a four-export helper module.

**Non-exported helpers are declared above the export that uses them.** This holds
at all 12 helper sites. `validate/validate-field.ts` is the model: `isEmpty`,
then `passes`, then the exported `validateField`.

**No side effects.** No `console`, no `process.env`, no filesystem or network
access anywhere in the package. Module scope holds declarations only.

## Naming

**A file maps 1:1 to its export**: `<stage>-<subject>.ts` exports
`stageSubject`. `resolve-form-option.ts` exports `resolveFormOption`,
`compile-form-section.ts` exports `compileFormSection`, `render-navigation.ts`
exports `renderNavigation`.

**Sub-rule: the one pipeline-step file per folder drops the `Form` and exports
the bare verb.** `compile-form.ts` exports `compile`, `resolve-form.ts` exports
`resolve`, `render-form.ts` exports `render`.

**Utility modules are named for the thing, not the action**, and are the accepted
break from the 1:1 rule. Do not rename them:

| File                          | Export                                    |
| ----------------------------- | ----------------------------------------- |
| `resolve/localize.ts`         | `resolveLocalizedText`                    |
| `compile/expression.ts`       | `evaluateExpression`                      |
| `compile/template.ts`         | `interpolateTemplate`                     |
| `compile/messages.ts`         | `DEFAULT_MESSAGES`, `ValidationMessages`  |
| `compile/next.ts`             | `resolveNextSectionId`, `isExternalNextSectionId` |
| `render/field-metadata.ts`    | four bound-reading helpers                |
| `render/render-defaults.ts`   | `buildDefaultValues`                      |
| `render/find-previous-section.ts` | `findPreviousSectionId`                |

**Type files take the bare concept name**, kebab-case, no suffix:
`types/render/multiple-select-field.ts`, `types/schema/localized-text.ts`.

**`SCREAMING_SNAKE_CASE` for exported constant tuples and records.**

**Acronyms capitalise as words**: `Html`, `Url`, `Id`, `Yaml`, `Json`, `Api`. So
`FORM_JSON_SCHEMA` and `assertJsonSchemaCoverage`, not `JSONSchema`.

## Types

**Use a `type` alias.** The package has exactly **one** `interface`,
`IStructuredAddress` in `types/schema/structured-address.ts`, and it is not even
referenced inside the package. Do not add another.

**Prefix every exported shape with `I`**, across all four families:
`IDeclarativeForm`, `IResolvedForm`, `ICompiledForm`, `IRenderableForm`,
`IRenderableMultipleSelectField`.

**Three categories are deliberately un-prefixed. Do not "fix" them:**

1. **The generic model templates** in `types/schema/model.ts`: `Form<Text>`,
   `FormField<Text>`, `FormSection<Text>` and their siblings. These are
   parameterized templates, not domain shapes. They are internal by design.
   `types/schema/index.ts` instantiates them with `ILocalizedText` and
   `types/resolved.ts` instantiates them with `string`, and it is those
   instantiations that carry the `I` prefix and get exported. **Never export a
   template un-instantiated.**
2. **Options bags**: `ValidationMessages`, `RenderOptions`,
   `ToRenderableFormOptions`.
3. **The two scalar unions** derived from the canonical tuples:
   `DeclarativeFieldType`, `DeclarativeConnectionType`.

**`Array<T>`, never `T[]`.** This applies in every type position, including
nested ones.

```ts
options: Array<ICompiledFormOption>;        // correct
validation: Array<ICompiledValidationRule>; // correct
options: ICompiledFormOption[];             // wrong
```

**`readonly T[]` becomes `ReadonlyArray<T>`, not `Array<T>`**, which would
silently drop the `readonly`. Four sites use it, all guarding a canonical tuple,
for example in `types/schema/field-type.ts`.

**No `enum`.** Compiler-enforced, see [Module style](#module-style). The pattern
is a `const` tuple plus a derived union plus a type guard, as in
`types/schema/field-type.ts` and `types/schema/connection-type.ts`.

**No `any`, anywhere.** The package has zero occurrences, which makes it stricter
than `packages/api`, where `any` is permitted at named integration boundaries.
Engine has no such boundaries. Opaque data is `Record<string, unknown>`, the
shape used for the answers bag throughout the pipeline.

**Tag discriminated unions on `type`**, as `IRenderableNavigation` does in
`types/render/navigation.ts`.

**One concept per file under `types/render/`, with a flat alphabetical
`export *` barrel.** `types/render/index.ts` is one star export per file, sorted
by filename. A new type file that is not added to the barrel is unreachable from
outside the package.

## Imports

**Use `import type` for type-only imports.** 79 statements do.

**When one module supplies both a value and a type, use the inline `type`
modifier rather than a second statement.**

```ts
import { DEFAULT_MESSAGES, type ValidationMessages } from './messages';
```

**Order type imports first, then value imports.**

```ts
import type { ICompiledForm, IResolvedForm } from '../types';
import { compileFormSection } from './compile-form-section';
```

Note this differs from `packages/api`, which groups non-relative before relative
and alphabetises within each group. Do not carry api's ordering over. Within each
block engine's order is roughly alphabetical but hand-maintained and not linted:
`resolve/resolve-form.ts` and `compile/compile-form-field.ts` both deviate, so
treat alphabetical as a tidy default rather than a rule to enforce.

**Relative paths only.** Never import this package through its own name
`@declarativeforms/engine`, and never go deeper than one `../`.

**Cross-folder type imports go through the parent barrel. Same-folder imports go
direct to the file.**

```ts
import type { ICompiledForm } from '../types';   // correct, cross-folder
import { resolveFormOption } from './resolve-form-option'; // correct, sibling
```

A file in `compile/` never writes `from '.'`. It names its sibling file.

**Two deliberate barrel bypasses exist. Leave them:** `json-schema.ts` imports
the two canonical tuples from their deep paths because it needs only those, and
`evaluateExpression` is imported from `'../compile/expression'` because
`compile/index.ts` does not re-export it.

## Function signatures

**Annotate the return type of every function**, exported or not. All 39 exported
functions do, with no exceptions. This is stricter than `packages/api`, which has
one unannotated function.

**Use parameter defaults sparingly, and only for genuine options**: `locale = 'en'`
in `resolve/localize.ts`, `options = {}` in `render/render-form.ts`,
`messages = DEFAULT_MESSAGES` in `compile/compile-form.ts`. Everywhere else a
default is applied in the body with `??`.

**`undefined` and `null` both appear here, and they mean different things.** Do
not collapse them, and do not change either to match api's
`null`-means-absent rule.

- **`undefined` means absent or optional.** `validateField` returns `undefined`
  when a field passes. The helpers in `render/field-metadata.ts` return
  `undefined` for a bound that was not authored.
- **`null` is a typed "no value captured yet" sentinel**, used in exactly two
  places: `render/render-defaults.ts` returns `null` as the empty default for
  `camera`, `geolocation` and `signature`, and `compile/compile-connection.ts`
  returns `null` for a connection that must not fire.

**Prefer an optional parameter (`?`) over a `| undefined` union**, except where
the value is explicitly passable as undefined in a discriminated position, as in
`compile/compile-form-completion.ts`.

## Control flow

**Guard clauses first, happy path last.**

**Always brace. Never write a single-line `if`.**

```ts
if (Array.isArray(value)) {          // correct
  return value.length >= Number(rule.value);
}

if (Array.isArray(value)) return value.length >= n;  // wrong
```

**The `switch` rule has two halves, and the difference is deliberate. Understand
which case you are in before you add a `default`.**

- **Omit `default` where the union is closed and exhaustiveness should be
  enforced.** The three switches over the validator union do this
  (`validate/validate-field.ts`, `resolve/resolve-form-validator.ts`,
  `compile/compile-form-validator.ts`). Because every branch returns and the
  function's return type excludes `undefined`, adding a validator kind without a
  branch is a compile error. That is the point. **Do not add a `default` to
  these: it would silently disable the check.**
- **Add a `default` only where a shared tail genuinely absorbs many members.**
  The four switches over `field.type` do this
  (`resolve/resolve-form-field.ts`, `compile/compile-form-field.ts`,
  `render/render-form-field.ts`, `render/render-defaults.ts`), because roughly
  ten generic-shaped field types legitimately share one branch.

**`??` for nullish defaults, `||` for falsy defaults and boolean logic.** One
`||` looks like a `??` bug and is not: in `compile/compile-form-validator.ts`,
`validator.message || interpolateTemplate(...)` intentionally falls back when an
author supplies an empty message.

**Iterate with `for...of` and skip with `continue`.**

## Purity and immutability

**Every function is pure. Never mutate a parameter.** A repo-wide search finds no
parameter mutation. The only in-place writes are on locally created accumulators,
such as the `rules` array in `compile/compile-form-validator.ts`.

**Build new objects with spread.**

**The conditional-spread idiom is the most repeated pattern in the package, at 89
sites. Use it rather than building an object and deleting keys.**

```ts
...(section.id !== undefined && { id: section.id }),   // 84 sites
...(compiled.title && { title: compiled.title }),      // 5 sites
```

The `!== undefined` form is the default. The plain-truthy form is for the handful
of fields where an empty string should also be omitted. Pick deliberately.

**Throwing is for invariant violations only.** There are exactly two `throw`
sites, both plain `new Error`: `render/render-form.ts` rejects a form with no
sections, and `json-schema.ts` carries a coverage assertion that runs at build
time. No custom error classes.

**There is exactly one `try/catch`**, in `compile/expression.ts`. Do not add
another to paper over a failure.

## Formatting

Prettier owns the mechanics. `packages/engine/prettier.config.cjs` sets only
`singleQuote: true`. Everything else is the Prettier 3 default: 80 columns,
semicolons, trailing commas everywhere, always-parenthesised arrow parameters.

**Run `npm run lint -w @declarativeforms/engine`.** It writes in place and lists
what it changed. A second run must list nothing.

**Before this config existed, the package had no Prettier config and no lint
script, and that is exactly how five files ended up double-quoted:** Prettier's
default is `singleQuote: false`, and a config in a sibling package is not
inherited. The config file is the fix. Do not delete it.

**Single quotes, with one legitimate exception that Prettier handles for you.** A
string whose content contains an apostrophe stays double-quoted, because
switching it would mean escaping. `json-schema.ts` has several, such as
`"The field's label. Supports templating."`. This is correct output, not drift.
**Never audit quote style with a bare `grep '"'`. Use `prettier --check`.**

What Prettier does not decide, and you must get right by hand:

**Blank lines mark topic boundaries.** Put one after a `const` whose value is
then consumed by a statement with a different concern, and before a guard `if`
that is not the first statement in its block. Do not put one immediately after an
opening `{`, and do not put one between tightly coupled statements.

```ts
const form = parse(text);

if (!form.sections) {
  return null;
}
```

**Do not introduce a local just to shorten an expression.** Read the property
directly.

## Known inconsistencies

Recorded so you neither copy them nor "fix" them as a drive-by. Correct one only
when you are already editing that line for another reason.

- **`compile/compile-form-validator.ts` exports `buildValidationRules`**, breaking
  the filename-to-export rule that its twin `resolve/resolve-form-validator.ts`
  follows. The export is public through the compile path, so renaming it is a
  breaking change, not a tidy-up.
- **`DEFAULT_MESSAGES`, `toRenderableForm` and `DECLARATIVE_CONNECTION_TYPES` have
  no consumer in this repository.** They are still **intentional public API**. Do
  not delete them as dead code.
- **`compile/next.ts` exports `isExternalNextSectionId()` and nothing calls it**,
  while three other sites re-implement the same `startsWith('https://')` check
  inline, one of them in `packages/api`. Prefer the helper in new code.
- **`types/schema/model.ts` mixes array styles by necessity**, not by choice: it
  is the file most affected by the `Array<T>` rule, so check it first if you are
  unsure what the convention looks like in a generic context.
- **`IStructuredAddress` is the only `interface` and is unused inside the
  package.** It exists for consumers.

## Before you hand work back

Run these, in this order:

```bash
npm run lint -w @declarativeforms/engine    # must list nothing on a second run
npm run build -w @declarativeforms/engine   # tsc -b, must pass clean
npx tsc -b                                  # from the repo root
```

**The root build is not optional.** `packages/api` consumes engine's emitted
`.d.ts`, so a type change here breaks api rather than engine, and engine's own
build will not tell you.

**If you touched `json-schema.ts` or `types/schema/`, also build the web app:**

```bash
npm run build -w @declarativeforms/core
```

That is the only thing that runs the schema assertions. They execute when Next
prerenders the static `/schema.json` route, and they fail the build if a field or
connection type has no schema branch, if a field type is undocumented in
`packages/core/public/AGENTS.md`, or if `contact.yaml` or `kitchen-sink.yaml` no
longer validates.

Then check the diff by hand:

```bash
grep -rn "/\*\*" packages/engine/src                      # expect nothing
grep -rnE "^[[:space:]]*//" packages/engine/src           # expect nothing
grep -rnE "[A-Za-z_>][[:space:]]*\[\]" packages/engine/src  # expect nothing
grep -rnE "if \(.*\) (return|continue|break|throw)" packages/engine/src
grep -rnE ": any|<any>|as any" packages/engine/src        # expect nothing
```

And confirm by inspection:

- No comment was added, including on an exported function or type.
- No `*.test.ts` was added.
- Every new function has an explicit return type.
- Every new exported shape is an `I`-prefixed `type`, and any new file under
  `types/render/` was added to that folder's barrel.
- A new `switch` over a closed union has no `default`.
