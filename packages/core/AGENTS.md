# packages/core: coding standards

This file describes how code in `packages/core` is written. It is not
aspirational. Every rule below is already true of the code in `src`, and each one
cites a file that demonstrates it.

If this file and the code disagree, the code is wrong. Fix the code, then keep
this file accurate.

Core is the web app: React 19 and Next.js 16 on the App Router. It is the only
package in this repo that contains generated vendor code inside `src`, and the
only one with a real ESLint config. Both facts change the rules, so read
[Generated code](#generated-code) and [Formatting](#formatting) before you run a
tool over this package.

This is an internal engineering document. It has nothing to do with
`public/AGENTS.md`, which is a published product asset that teaches external
agents to author YAML forms. `next.config.ts` sets `agentRules: false` so Next
does not generate a competing file of this name.

## Contents

- [The non-negotiables](#the-non-negotiables)
- [Layout](#layout)
- [Generated code](#generated-code)
- [Comments](#comments)
- [Tests](#tests)
- [Module style](#module-style)
- [Destructuring](#destructuring)
- [Naming](#naming)
- [Types](#types)
- [Imports](#imports)
- [Function signatures](#function-signatures)
- [Control flow](#control-flow)
- [Server and client boundaries](#server-and-client-boundaries)
- [Errors](#errors)
- [Formatting](#formatting)
- [Known inconsistencies](#known-inconsistencies)
- [Before you hand work back](#before-you-hand-work-back)

## The non-negotiables

Break any of these and the change is wrong, regardless of whether it compiles.

1. **No comments in `src`.** The package has three, and all three are compiler
   or bundler directives.
2. **No test files.** This package ships without tests.
3. **No object destructuring.** Not in a signature, not in a body. Array and
   tuple destructuring is fine.
4. **`Array<T>`, never `T[]`.**
5. **No `any`.** The package contains zero occurrences. Keep it that way.
6. **Explicit return type on every function except a JSX component.**
7. **Braces on every block.** No single-line `if (x) return y;`.
8. **Imports are one unbroken block.** No blank line between them, and none
   after the leading directive.
9. **A blank line before every `return`, and after every guard block.**
10. **Single quotes.** Run `npm run format`.

## Layout

78 hand-written files, plus 16 generated ones under `src/components/ui`.

| Path | Holds |
| ---- | ----- |
| `app/` | App Router routing, metadata and the request-time shell. Routing only |
| `views/` | Page-level composition, framework-agnostic |
| `components/declarative-form/` | The form renderer, split into `core`, `fields`, `supporting`, `scaffolding` |
| `components/ui/` | Generated shadcn primitives. See [Generated code](#generated-code) |
| `lib/` | Framework-agnostic helpers: api, analytics, metadata, theme, upload |
| `i18n/` | Locale primitives, the client context, and the server resolver |

**Dependency direction, one way only:**

```
app  ->  views  ->  components  ->  lib, i18n
```

- **`app/` composes, it does not implement.** A route file resolves params,
  awaits data and renders a view. `app/[slug]/page.tsx` is the model.
- **Nothing imports upward.** A component never imports from `views/` or `app/`.
- **`components/declarative-form/fields/*` depend on `supporting/`, never on each
  other.** The shared contract is `supporting/field.types.ts`, reached through
  the `supporting/` barrel like everything else in that folder.
- **Every component folder has an `index.ts` and is imported through it.**
  `components/`, `components/ui/`, `declarative-form/`, `declarative-form/core/`,
  `declarative-form/fields/` and `declarative-form/supporting/` all have one. A
  new module in one of those folders is added to its barrel, or it is
  unreachable by the rule in [Imports](#imports). `lib/`, `app/`, `i18n/messages/`
  and `scaffolding/` have no barrel and need none.
- **Only `core/field-registry.ts` knows the full set of field components.** It is
  annotated `Record<DeclarativeFieldType, DeclarativeFieldRenderer>` rather than
  asserted, so a field type added to the engine fails this package's build until
  it has a renderer. Do not change that annotation to an assertion.

## Generated code

**`src/components/ui/` is shadcn output. Do not hand-edit it.** 16 files, driven
by `packages/core/components.json` (style `radix-nova`, `rsc: true`, lucide
icons). Add or update a primitive with the shadcn CLI, not by typing.

Two consequences you need to know:

- **It is formatted by `npm run format` along with everything else**, because
  nothing excludes it. The shadcn CLI writes double quotes, so the next
  `shadcn add` will reintroduce them. Re-running `format` is the fix. Never
  hand-edit the quotes back.
- **Its own conventions are out of scope for this document.** It types props
  inline as `React.ComponentProps<'div'> & VariantProps<typeof x>`, declares no
  named types, and annotates no return types. That is upstream's style. Do not
  "fix" it, and do not cite it as precedent for hand-written code.

Import it through its barrel, never a deep file path:

```ts
import { Field, FieldError } from '@/components/ui';   // correct
import { Button } from '@/components/ui/button';       // wrong
```

## Comments

**Write no comments in `src`.** The package contains exactly three, and all
three are directives that the compiler or the bundler reads:

```ts
// components/declarative-form/fields/address/google-places.ts:1
/// <reference types="google.maps" />

// lib/form-schema.ts, twice
path.resolve(/*turbopackIgnore: true*/ packageDirectory, AGENT_INSTRUCTIONS)
```

**Those three must survive any cleanup.** A regex for `^\s*//` matches the
triple-slash reference, and a regex for `^\s*/\*` matches the line the
`turbopackIgnore` directives sit on, which also carries a function argument.
Deleting either breaks the build: `turbopackIgnore` is what stops Turbopack
tracing the whole repository into the standalone output.

If you feel the need to explain something, change the code instead: rename the
variable, extract a named helper, or introduce a named constant.

**Two exceptions, and only two:**

1. `// TODO: <imperative instruction>` describing a concrete refactor of the code
   directly beneath it. There are none right now. The last four said
   `// TODO: don't destructure, use the params.slug, etc directly`, and they were
   deleted when the refactor they asked for was done. Do the same.
2. **Genuine compiler and tooling directives**: `@ts-expect-error`,
   `eslint-disable-next-line`, `prettier-ignore`, `/// <reference>`,
   `/*turbopackIgnore*/`. The directive is the comment. Do not wrap prose around
   it.

**This rule covers `src` only.** `next.config.ts` and `eslint.config.mjs` keep
their comments, because they explain tool behaviour that has no other home, and
because a config file is read by a person deciding whether to change a setting.
`app/globals.css` keeps its CSS comments too. That asymmetry is deliberate.

## Tests

**This package has no tests, and you should not add any.** Do not create
`*.test.ts`/`*.test.tsx` files, do not add a test framework, do not add
fixtures.

Core has never had a test script or a jest config. `packages/api/jest.config.cjs`
is rooted at `packages/api` and cannot pick anything here up. Verification is
`typecheck`, `lint`, `format` and the build. See
[Before you hand work back](#before-you-hand-work-back).

## Module style

**Function components. No classes** (the package has zero).

**Declare a component with `export function Name()`.** Never `React.FC`, never an
arrow function assigned to a `const`. There is no `React.FC` anywhere in this
package and there should not be.

```ts
export function ClearButton(props: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
```

**Use `export default function` only where Next requires it**: `page.tsx`,
`layout.tsx`, `route.ts`, `not-found.tsx`, `opengraph-image.tsx`, and a component
loaded through `next/dynamic`. Everywhere else, a named export.

**One `forwardRef` component exists** (`core/section.component.tsx`). Do not add
more unless a parent genuinely needs the node.

**Helpers are plain `function` declarations placed above the component that uses
them**, as in `fields/file-upload/file-preview.component.tsx` (`FileTypeIcon`,
`formatFileSize`, then `FilePreview`).

**Hooks live in a `use-*.ts` file whose name matches the export**:
`use-declarative-form.ts` exports `useDeclarativeForm`. The two exceptions are
`useI18n` and `useSyncLangParam`, which sit in `i18n/index.tsx` beside the
provider they belong to.

## Destructuring

This is the package's most distinctive rule, and the one most likely to look
wrong to someone arriving from ordinary React code.

**Object destructuring is not allowed.** Not in a function signature, not in a
function body, not in a callback parameter.

**Array and tuple destructuring is allowed anywhere**, so React's tuple-returning
hooks are unaffected:

```ts
const [value, setValue] = useState(''); // correct, tuple
const parts = path.split('?');          // fine either way
```

**A component takes one `props` parameter and reads through it.**

```ts
export function FilePreview(props: {
  file: UploadedFile;
  onRemove: () => void;
}) {
  return <p>{props.file.name}</p>;
}

export function FilePreview({ file, onRemove }: {...}) {  // wrong
```

**A Next route awaits the promise into a local, then reads properties off it.** A
local is not destructuring:

```ts
export default async function Page(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const params = await props.params;
  const query = await props.searchParams;

  return (
    <PageShell embed={query.embed === 'true'}>
      <FormRoute id={params.slug} />
    </PageShell>
  );
}
```

**A hook result is named after the thing, then read through.**

```ts
const i18n = useI18n();
const formQuery = useQuery({ ... });
const blobUpload = useUploadBlob(props.control.onChange);

i18n.t('address.placeholder');
formQuery.data;
blobUpload.isUploading;
```

**A callback parameter is named, not destructured.**

```ts
render={(renderProps) => <Renderer control={renderProps.field} />}
.map((entry) => toSupportedLocale(entry.tag))
```

Three notes that will save you time:

- **Named imports are not destructuring.** `import { useState } from 'react'` is
  correct and unaffected.
- **Do not declare a local just to shorten an expression.** `props.field.options`
  is read directly at its three use sites in
  `fields/single-select-field.component.tsx`; there is no `const options`.
- **A local that captures a stable function reference for a dependency array is
  not "shortening", and is correct.** `fields/use-upload-blob.ts` does
  `const uploadBlob = mutation.mutateAsync;` and depends on `[uploadBlob]`,
  because `react-hooks/exhaustive-deps` demands the whole `mutation` object
  otherwise and that would defeat the memoisation. Same for
  `const translate = i18n.t;` in `views/thank-you.page.tsx`.

**One permitted exception, and it is the only one.**
`supporting/html-text.tsx` uses a rest element to forward arbitrary props:

```ts
export function HtmlText<T extends ElementType = 'span'>({
  html,
  as,
  ...rest
}: HtmlTextProps<T>) {
```

Prop forwarding has no non-destructured form that keeps its types. If you write
another component that forwards unknown props, this is the shape to copy. Do not
use it as licence to destructure named props.

## Naming

**Files**, kebab-case, with a suffix that names the role:

| Pattern | Count | Denotes |
| ------- | ----- | ------- |
| `*.component.tsx` | 23 | A component under `components/declarative-form/` |
| `*.page.tsx` | 4 | A page-level view under `views/` |
| `use-*.ts` | 5 | A hook, named for its export |
| `*.types.ts` | 3 | A shared type-only module |
| `*.client.tsx` | 1 | An explicit client boundary inside `app/` |
| `page.tsx`, `layout.tsx`, `route.ts`, `not-found.tsx`, `opengraph-image.tsx` | 9 | Next file conventions. The names are fixed |

**Components are PascalCase and match their filename**: `clear-button.component.tsx`
exports `ClearButton`.

**A callback prop is `onX`; a handler defined in the component is `handleX`.**
`fields/single-select-field.component.tsx` has `handleValueChange`;
`file-preview.component.tsx` takes `onRemove`. A handler that reads as a verb
phrase may use that instead (`startCamera`, `capturePhoto`, `clearSignature`).

**`SCREAMING_SNAKE_CASE` for module constants, and only when reused.** This is
why `lib/api.ts` has no `API_BASE_URL`: it was used once and is now inline in the
template it belongs to.

**Acronyms capitalise as words**: `Html`, `Url`, `Id`, `Json`, `Api`. So
`HtmlText` and `getBackendUrl`. `HTML_ENTITIES` and `API_BASE_URL`-style
constants keep their SCREAMING_SNAKE form. `HTMLCanvasElement` and
`dangerouslySetInnerHTML` are platform names, not ours.

## Types

**Use a `type` alias.** There is exactly one `interface` in the package and it is
required by the language, not chosen:

```ts
// lib/runtime-config.ts
declare global {
  interface Window {
    __CONFIG__?: { googleMapsApiKey?: string };
  }
}
```

A global augmentation must use `interface`. Nothing else may.

**Core does not use the `I` prefix, and that is deliberate.** This is the one
place core diverges from `packages/api/AGENTS.md` and
`packages/engine/AGENTS.md`. Both of those exempt props bags, options bags and
scalar unions from the prefix; in core almost every type is one of those three,
so the exemption swallows the rule. `FieldProps`, `FormRouteProps`,
`UploadMessages`, `TranslationMessages`, `Locale`, `TranslationKey`,
`UploadBlob`, `FileUploads` are all correct as they are. Do not rename them.

**Types imported from the engine keep their names**, prefix included:
`IRenderableField`, `IDeclarativeForm`, `IStructuredAddress`. Never re-alias
them locally.

**Types live beside the code that uses them.** Colocate in the component file
when only that file needs it (`CameraState`, `AddressSearch`, `Point`). Promote
to a `*.types.ts` module when several files share it. Three exist:
`supporting/field.types.ts`, `core/use-declarative-form.types.ts` and
`app/search-params.types.ts`. **Core has no `types/` directory and does not need
one.**

**`Array<T>`, never `T[]`**, in every type position including nested ones. The
only `[]` left in the package are three empty-array literals in
`fields/address/google-places.ts`, which are values, not types.

```ts
files: Array<UploadedFile>;                       // correct
suggestions: Array<PlacePrediction>;              // correct
acceptedMimeTypes: string[];                      // wrong
```

**The repeated App Router search-params shape has one home.** Import it; do not
retype the `Record`:

```ts
// app/search-params.types.ts
export type SearchParams = Record<string, string | Array<string> | undefined>;
```

**No `enum`.** **No `any`**: the package has zero occurrences, which makes it
stricter than api, where `any` is permitted at five named boundaries. Opaque
values are `unknown` and narrowed with a type predicate, as
`fields/geolocation/geolocation-field.component.tsx` does with
`isGeolocationValue`.

**One `as unknown as` exists**, in `fields/address/google-places.ts`, bridging the
untyped Google Places runtime object to a local interface. Do not add a second
without the same justification.

## Imports

**Use `import type` for type-only imports**, or the inline `type` modifier when
one module supplies both:

```ts
import { DeclarativeForm, HeroSection, type FormEffect } from '@/components';
```

**The import section is one unbroken block.** No blank line between two import
statements, and no blank line after a leading `'use client';` or
`import 'server-only';`. The older style grouped imports by origin with blank
lines between the groups; that grouping is gone.

```ts
'use client';
import { useEffect, useState } from 'react';
import type { IRenderableAddressField } from '@declarativeforms/engine';
import { useI18n } from '@/i18n';
import { bindElement } from '@/components/declarative-form/supporting';
```

```ts
'use client';
                                       // wrong: blank after the directive
import { useEffect } from 'react';
                                       // wrong: blank between imports
import { useI18n } from '@/i18n';
```

**Prettier will not do this for you.** It preserves author blank lines inside an
import section, so this is a review rule.

**Use the `@/` alias for anything outside the current folder.** Not "prefer": the
package has **zero** `'../'` imports, and that is the checkable state. Only
same-folder `'./x'` imports are relative.

```ts
import { PageShell } from '@/app/page-shell';                    // correct
import type { SearchParams } from '@/app/search-params.types';   // correct
import { bindTextInput } from '../supporting/bind-text-input';   // wrong
import { PageShell } from '../page-shell';                       // wrong
```

**Import a component folder through its barrel, never past it.** This applies to
`@/components`, `@/components/ui`, `@/components/declarative-form/supporting` and
`@/components/declarative-form/fields`, and to `@/i18n`.

```ts
import {
  bindTextInput,
  type FieldProps,
} from '@/components/declarative-form/supporting';               // correct

import type { FieldProps }
  from '@/components/declarative-form/supporting/field.types';   // wrong
```

Four cases are not violations of that rule, and all four are deliberate:

- **A file inside a barrelled folder imports its siblings directly.** The rule is
  for consumers. `components/ui/field.tsx` importing `@/components/ui/label` is
  correct, and is upstream's own code besides.
- **`@/lib` has no barrel**, so `@/lib/utils` and `@/lib/analytics` are the
  correct form. Same for `@/app/page-shell` and
  `@/components/declarative-form/scaffolding/hero-section.component`.
- **`@/i18n/server` and `@/i18n/locale` bypass the `@/i18n` barrel on purpose.**
  That barrel is a client module; these two must stay reachable from server code
  without dragging it in.
- **A route file imports the one view it renders**, as
  `@/views/form-route`, not through `@/views`. A route should pull only the view
  it renders into its bundle. `views/index.ts` exists but is currently imported
  by nothing.

**One statement per module.** Merge, rather than importing twice from the same
specifier. `address-field.component.tsx` shows the shape, values first and inline
`type` members last.

**Order is not enforced by any tool here.** Write it in this order, inside the
single block, and keep a file internally consistent:

1. React and Next
2. Other external packages
3. `@declarativeforms/engine`
4. `@/`-aliased internal modules
5. Relative modules

## Function signatures

**Annotate the return type of every function, with one exception: a JSX
component.** 90 functions are annotated; the 43 unannotated ones are all
components.

Components are exempt because the annotation adds nothing the compiler cannot
already see, and because the correct spelling churns between React versions.
There is no `JSX.Element`, `React.JSX.Element`, `ReactNode` or `ReactElement`
return annotation anywhere in this package, and adding one would be the
inconsistency.

Everything else is annotated, including nested handlers and callbacks:

```ts
export function GET(): Response {                              // route handler
export function cn(...inputs: Array<ClassValue>): string {     // helper
export function useSyncLangParam(formLocale: string | undefined): void {
const handlePointerDown = (event: React.PointerEvent): void => {
async function submitToBackend(...): Promise<string | undefined> {
export async function generateMetadata(...): Promise<Metadata> {
```

**A hook that returns an object needs a named type**, exported beside it, so
callers and the annotation agree: `UploadBlob` in `use-upload-blob.ts`,
`FileUploads` in `use-file-uploads.ts`, `UseDeclarativeForm` in
`use-declarative-form.types.ts`, `ElementBinding` and `TextInputBinding` in
`supporting/bind-text-input.ts`.

## Control flow

**Guard clauses first, happy path last.** Every field component opens with its
rejections, and `views/form-route.tsx` has four sequential early returns for
error, loading, not-yet-open and closed before the main render.

**Always brace. Never write a single-line `if`.**

```ts
if (!ctx) {              // correct
  return;
}

if (!ctx) return;        // wrong
```

**Blank lines are mechanical here, not a matter of taste.** Two rules, both
checkable, and neither enforced by Prettier or ESLint:

**1. A blank line before every `return` that is not the first statement in its
block.** A `return` that is the only statement in a block, or the first, gets
nothing, so one-line arrow bodies and guard blocks are untouched.

```ts
const rect = canvas.getBoundingClientRect();

return rect.width;
```

**2. A blank line after every guard block.** A guard is an `if` with no `else`
whose body is a single `return`, `continue`, `break` or `throw`. Nothing is added
if the next line is already blank or closes an enclosing block.

```ts
if (!normalized) {
  return null;
}

const base = normalized.split('-')[0];
```

Beyond those two, a blank line separates statements with different concerns, as
after a `const` whose value the next statement does not consume. **Never put one
immediately after an opening `{`.**

**`??` for nullish defaults, `||` for falsy defaults and boolean logic.** Both
appear deliberately: `control.value ?? ''` keeps an empty string, while
`field.placeholder || i18n.t('input.placeholder')` falls back for an empty one.

**Prefer a ternary in JSX over a nested conditional block**, and `&&` for a
render-or-nothing branch. Both are used throughout the field components.

## Server and client boundaries

The rule most likely to be broken by someone applying the api or engine document
to this package. Neither of those runs in a browser.

**`'use client'` is the first line of the file, followed immediately by the
imports with no blank line between.** 63 files carry it.

```ts
'use client';
import { useEffect } from 'react';
```

**`import 'server-only'` marks a module the client bundle must never reach.** Four
files use it, including `i18n/server.ts` and `lib/form-metadata.ts`. Add it to any
new module that reads request state or the filesystem.

**Set `export const dynamic` when a route's rendering mode matters.**
`force-dynamic` in `app/layout.tsx`, because every page reads request-time state.
`force-static` in `app/healthz/route.ts` and `app/schema.json/route.ts`, and for
the latter it is load-bearing: being prerendered is what turns the schema
assertions into build failures.

**Read `process.env` at request time in a server component, never at module scope
in anything the client can reach.** This is the whole reason
`app/runtime-config-script.tsx` exists: it awaits `connection()` to opt out of
prerendering, then inlines `window.__CONFIG__` before any bundle runs, so
rotating the Google Maps key needs a restart rather than a rebuild.

**A browser global read during render must not differ between server and
client.** `fields/address/use-google-places-ready.ts` seeds its state `false`
rather than from a probe for exactly this reason. Seeding from the global would
make the first render disagree and throw away the tree.

## Errors

**Throw a plain `Error`.** There are six sites and no custom error classes.
Sentence case, no trailing period, a colon before an interpolated value:

```ts
throw new Error(`Form not found: ${response.status}`);
throw new Error('useI18n must be used within I18nProvider');
```

**`console.error` and `console.warn` are permitted inside a `catch` that
recovers**, matching api. All ten sites qualify, in `google-places.ts`,
`address-field.component.tsx` and `lib/analytics.ts`. Do not add a logging
library, and do not log outside a `catch`.

**A caught error is rethrown unchanged when the caller must see it.**
`views/form-route.tsx` resets its completion ref and rethrows.

## Formatting

Two separate tools, and they are not interchangeable:

```bash
npm run format   # prettier --write, owns quotes and whitespace
npm run lint     # eslint, owns correctness rules
```

**Prettier is configured by `packages/core/prettier.config.cjs`, which sets only
`singleQuote: true`.** Everything else is the Prettier 3 default: 80 columns,
semicolons, trailing commas, always-parenthesised arrow parameters. Run
`npm run format` and let it decide. A second run must list nothing.

**Before that config existed, core had no Prettier config and no format script,
and roughly ten files drifted to double quotes.** Prettier's default is
`singleQuote: false`, and a config in a sibling package is not inherited. The
config file is the fix. Do not delete it.

**Never audit quote style with a bare `grep '"'`.** JSX attributes are
double-quoted by design, and a string containing an apostrophe stays
double-quoted because switching it would mean escaping. Use
`prettier --check`.

**ESLint carries the Next.js rule sets** (`core-web-vitals` and `typescript`) and
one project override. The override is scoped to `files: ['**/*.{ts,tsx}']`, and
that scope is load-bearing: `eslint-config-next` registers the `react-hooks`
plugin only for `js,jsx,mjs,ts,tsx,mts,cts`, so an unscoped object referencing a
`react-hooks` rule is a hard config error the moment a `.cjs` file exists in the
package. It does now: `prettier.config.cjs`.

**Five ESLint warnings are expected and are not yours to fix** unless you are
changing that code anyway. See [Known inconsistencies](#known-inconsistencies).

## Known inconsistencies

Recorded so you neither copy them nor "fix" them as a drive-by.

- **Five standing ESLint warnings, zero errors.** A custom font in
  `app/layout.tsx`, two `<img>` elements in the camera and signature fields, an
  unsupported `aria-required` on a `role="group"` in the multiple-select field,
  and one `set-state-in-effect` in the address autocomplete effect. The last is
  downgraded to `warn` on purpose, with the reason recorded in
  `eslint.config.mjs`: reworking it would change autocomplete behaviour.
- **`components/ui` is linted and typechecked like hand-written code**, because
  nothing excludes it. Its 68 unannotated functions are therefore visible to any
  audit and should be ignored.
- **`app/healthz/route.ts` returns the literal `'OK!\n'`.** The Compose
  healthcheck polls it. Do not change the body.
- **`next.config.ts` bakes the API rewrite destination into
  `routes-manifest.json` at build time**, so `API_INTERNAL_ORIGIN` is a
  build-time value, not a runtime-configurable one. `GOOGLE_MAPS_API_KEY` is the
  opposite: read per request, so a restart is enough.
- **`supporting/html-text.tsx` is the only file with a rest element.** See
  [Destructuring](#destructuring).
- **`lib/form-schema.ts` reads two files from the repository root**
  (`contact.yaml`, `kitchen-sink.yaml`) during the build. The Dockerfile must
  copy them in before `next build`, and the `turbopackIgnore` directives must
  stay.
- **`views/index.ts` is imported by nothing.** Route files pull the one view they
  render, which is the right call for per-route bundling. The barrel is harmless
  but currently dead.
- **The two blank-line rules and the one-block import rule are core-local.**
  `packages/api` already satisfies all three, which is why it reads as the
  reference. `packages/engine` does **not**: it has one blank between imports in
  `parse/index.ts` and 22 returns with no preceding blank line, and it was
  deliberately left alone. Do not "align" engine on the strength of this file;
  `packages/engine/AGENTS.md` is the authority there.

## Before you hand work back

Run these, in this order:

```bash
npm run format -w @declarativeforms/core     # must list nothing on a second run
npm run typecheck -w @declarativeforms/core  # tsc --noEmit, must pass clean
npm run lint -w @declarativeforms/core       # eslint, 0 errors
npm run build -w @declarativeforms/core      # the only thing that runs the assertions
```

**The build is not optional.** It prerenders `/schema.json`, which runs
`assertJsonSchemaCoverage()` from the engine, `assertFieldTypesDocumented()`
against `public/AGENTS.md`, and `assertExampleFormsValid()` against
`contact.yaml` and `kitchen-sink.yaml`. A type change in the engine, or a new
field type, fails here rather than in the engine's own build.

If you changed anything the other packages consume, also run `npx tsc -b` from
the repository root.

Then check the diff by hand:

```bash
C=packages/core/src
grep -rnE '^[[:space:]]*(//|/\*)' $C --include='*.ts' --include='*.tsx'
grep -rnE '[A-Za-z_>][[:space:]]*\[\]' $C
grep -rnE 'const \{|function [A-Za-z]+(<[^>]*>)?\(\{|for \(const \{' $C | grep -v components/ui
grep -rnE 'if \(.*\) (return|continue|break|throw)' $C
grep -rnE ': any|as any|<any>' $C
grep -rn "from '\.\./" $C
```

Expected results, and nothing else:

- **Comments: 3.** The `/// <reference>` and the two `/*turbopackIgnore*/` lines.
- **`[]`: 3.** All three are empty-array literals in `google-places.ts`, not
  types.
- **Destructuring: 1.** The rest element in `supporting/html-text.tsx`. **Pipe
  through `grep -v components/ui`**, or the 68 destructured parameters in the
  generated primitives drown the signal. Note the `for (const {` arm: a
  `for...of` binding is destructuring too, and a grep that only looks for `} =`
  will miss it.
- **Relative imports: nothing.** The check is `'../'`, not `'../../'`: a single
  level up is a violation now.
- **Everything else: nothing.**

**The three whitespace rules have no linter.** Prettier does not add or remove
blank lines around statements, and it preserves them inside an import section, so
these are checked by reading the diff:

- imports form one unbroken block, with nothing after the directive,
- a blank line precedes every `return` that is not first in its block,
- a blank line follows every guard block.

And confirm by inspection:

- No comment was added beyond a `// TODO:` or a real directive.
- No object was destructured, in a signature or a body.
- Every new non-component function has an explicit return type, and no component
  gained one.
- A new hook that returns an object exported a named type for it.
- Every new module outside the current folder is reached through `@/`.
- `components/ui` was changed only by the shadcn CLI or by `npm run format`.
