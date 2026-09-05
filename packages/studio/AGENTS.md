# packages/studio: coding standards

This file describes how code in `packages/studio` is written. It is not
aspirational. Every rule below is already true of the code in `src`, and each one
cites a file that demonstrates it.

If this file and the code disagree, the code is wrong. Fix the code, then keep
this file accurate.

Studio is the form management interface: React 19 on Vite 8, a client-rendered
SPA. It holds 71 hand-written modules, one type-declaration file and 15
generated shadcn primitives: five views, 14 hooks, 15 `lib/` modules and six
`components/` subtrees.

Its standards are `packages/core`'s, because both are React and because the two
will share idioms as studio grows. Read
[Generated code](#generated-code) and [Formatting](#formatting) before you run a
tool over this package.

**Studio is not Next.js, and that is the difference that matters.** There is no
App Router, no server component, no `'use client'` and no request-time rendering.
Do not carry `packages/core/AGENTS.md`'s
`Server and client boundaries` section over here; nothing in it applies. Every
other section of that document does.

## Contents

- [The non-negotiables](#the-non-negotiables)
- [Layout](#layout)
- [Brand assets](#brand-assets)
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
- [Styling](#styling)
- [Errors](#errors)
- [Formatting](#formatting)
- [Known inconsistencies](#known-inconsistencies)
- [Before you hand work back](#before-you-hand-work-back)

## The non-negotiables

Break any of these and the change is wrong, regardless of whether it compiles.

1. **No comments in `src`.** The package has one, and it is a compiler
   directive.
2. **No test files.** This package ships without tests, and the repo has no
   Vitest precedent. See [Tests](#tests).
3. **No object destructuring.** Not in a signature, not in a body. Array and
   tuple destructuring is fine.
4. **`Array<T>`, never `T[]`.**
5. **No `any`.** The package contains zero occurrences. Keep it that way.
6. **Explicit return type on every function except a JSX component.**
7. **Braces on every block.** No single-line `if (x) return y;`.
8. **Imports are one unbroken block.** No blank line between them.
9. **A blank line before every `return`, and after every guard block.**
10. **Single quotes.** Run `npm run format`.

## Layout

70 hand-written modules, one declaration file, 15 generated primitives.

| Path | Holds |
| ---- | ----- |
| `src/main.tsx` | The Vite entry. Mounts `<App>` and imports the stylesheet. Nothing else |
| `src/app.component.tsx` | Composition root. The studio analogue of core's `app/layout.tsx` |
| `src/views/` | Page-level views, `*.page.tsx`. No barrel; a consumer imports the one view it renders |
| `src/components/<subtree>/` | Hand-written components, one `index.ts` barrel each: `conversation/`, `feedback/`, `forms/`, `organization/`, `shell/` |
| `src/components/ui/` | Generated shadcn primitives. See [Generated code](#generated-code) |
| `src/hooks/` | Hooks shared across views and components, `use-*.ts`. No barrel, so `@/hooks/use-session` is the correct form |
| `src/lib/` | Framework-agnostic helpers: the api client and paths, wire types, analytics and runtime config, the auth/selection/draft stores, query keys, error copy, preview URLs, time |
| `src/styles/globals.css` | Tailwind 4 entry and the shadcn design tokens |
| `src/vite-env.d.ts` | The `vite/client` type reference. One line, no exports |
| `public/` | Static files Vite copies to `dist/` verbatim and nginx serves at the site root: the favicon set, the apple-touch icon and `og-image.png`. Referenced from `index.html` by absolute path, never imported |
| `assets/` | Build-time sources for the files in `public/`, currently `og-image.svg`. **Not served and not copied.** See [Brand assets](#brand-assets) |

**Dependency direction, one way only:**

```
main  ->  app  ->  views  ->  components  ->  hooks  ->  lib
```

- **`main.tsx` bootstraps, it does not implement.** It creates the root, wraps in
  `StrictMode` and renders `<App />`. Anything else belongs in `app.component.tsx`
  or below.
- **Nothing imports upward.** A component never imports from `views/` or from
  `app.component.tsx`.
- **A hook may import `lib/` and other hooks, and nothing else.** It never
  imports a component, a view or `app.component.tsx`. A hook needed by exactly
  one component is colocated with that component instead, matching core's
  `fields/use-upload-blob.ts`.
- **`src/components/ui/` has an `index.ts` and is imported through it.** A
  primitive added by the shadcn CLI is added to that barrel, or it is unreachable
  by the rule in [Imports](#imports).
- **`src/lib/` has no barrel and needs none**, matching core. `@/lib/utils` is the
  correct form.
- **`src/components/index.ts` re-exports the six subtree barrels** and nothing
  else. Consumers import `@/components`; a file inside a subtree imports its
  siblings directly. Because six barrels are star-exported into one namespace,
  component names must be globally unique, which is why the sidebar footer is
  `WorkspaceFooter`-style naming rather than `SheetFooter`'s neighbourhood.
- **`src/hooks/` has no barrel and needs none**, matching `lib/`. A barrel would
  make every view pull every hook into its graph.

## Brand assets

**The icon set is core's, copied rather than shared.** `public/favicon.ico`,
`favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` and the two
`android-chrome-*.png` files are byte-identical to `packages/core/public/`. There
is no import path between two separately-built packages, so a copy is the only
mechanism. If core's mark changes, copy them again.

**`public/og-image.png` is generated, not drawn.** Its source is
`assets/og-image.svg`, which embeds `android-chrome-512x512.png` as a base64
`<image>` so the mark cannot drift from the favicon. Regenerate it after editing
the SVG:

```bash
rsvg-convert -w 1200 -h 630 packages/studio/assets/og-image.svg \
  -o packages/studio/public/og-image.png
```

Commit the PNG. `rsvg-convert` resolves fonts through fontconfig, so check the
output before committing: a missing font family fails silently and falls back.

**`og:image` and `og:url` in `index.html` are hardcoded to
`https://studio.frms.dev`.** Open Graph requires an absolute URL, and
`index.html` is a static file with no request context. A self-hosted instance
therefore shows the frms.dev card. If that ever needs fixing, the mechanism is a
`%VITE_STUDIO_ORIGIN%` placeholder, which Vite substitutes at build time.

`--theme-color` is `#F8D806`, sampled from the mark itself rather than chosen.

## Generated code

**`src/components/ui/` is shadcn output. Do not hand-edit it.** It is driven by
`packages/studio/components.json` (style `radix-nova`, `rsc: false`, lucide
icons). Add or update a primitive with the shadcn CLI, not by typing:

```bash
npx shadcn@4.19.0 add <primitive> --cwd packages/studio
npm run format -w @declarativeforms/studio
```

`components.json` is identical to core's except for two fields, and both
differences are correct: `rsc` is `false` because studio has no server
components, so generated primitives carry no `'use client'` directive; and
`tailwind.css` points at `src/styles/globals.css`.

**The `style` field is load-bearing and is resolved remotely.** `radix-nova` is
not a local style in the CLI, which only knows `default`, `new-york` and
`new-york-v4` offline. It is fetched from the registry on the strength of the
`style` field in `components.json`, which the CLI derives from
`--base radix --preset nova` at init time. If a registry fetch fails, `add`
silently produces the older generation: `@radix-ui/react-slot` instead of the
unified `radix-ui` package, `data-slot` with no `data-variant`/`data-size`, and no
`xs`/`icon-*` size variants. Check for those markers after any `add`.

Three consequences you need to know:

- **It is formatted by `npm run format` along with everything else**, because
  nothing excludes it. The shadcn CLI writes double quotes, so the next
  `shadcn add` will reintroduce them. Re-running `format` is the fix. Never
  hand-edit the quotes back.
- **It is linted with one rule turned off.** See
  [Known inconsistencies](#known-inconsistencies).
- **Its own conventions are out of scope for this document.** It types props
  inline as `React.ComponentProps<'button'> & VariantProps<typeof x>`, declares no
  named types, annotates no return types and destructures its props. That is
  upstream's style. Do not "fix" it, and do not cite it as precedent for
  hand-written code.

Import it through its barrel, never a deep file path:

```ts
import { Button } from '@/components/ui';         // correct
import { Button } from '@/components/ui/button';  // wrong
```

`src/lib/utils.ts` is created by the shadcn CLI but is **not** generated code: it
lives in `lib/`, and the hand-written rules apply to it. The CLI writes
`(...inputs: ClassValue[])` with no return type; the committed version reads
`(...inputs: Array<ClassValue>): string`, matching core byte for byte. If a
`shadcn` run overwrites it, restore it.

## Comments

**Write no comments in `src`.** The package contains exactly one, and it is a
directive the compiler reads:

```ts
// src/vite-env.d.ts:1
/// <reference types="vite/client" />
```

**That one must survive any cleanup.** A regex for `^\s*//` matches it. Deleting it
breaks `npm run typecheck`: it is what declares the ambient module types for the
`import '@/styles/globals.css'` side-effect import in `main.tsx`. It is the studio
equivalent of core's generated `next-env.d.ts`, with the difference that studio's
is committed, because nothing regenerates it.

If you feel the need to explain something, change the code instead: rename the
variable, extract a named helper, or introduce a named constant.

**Two exceptions, and only two:**

1. `// TODO: <imperative instruction>` describing a concrete refactor of the code
   directly beneath it. There are none right now.
2. **Genuine compiler and tooling directives**: `@ts-expect-error`,
   `eslint-disable-next-line`, `prettier-ignore`, `/// <reference>`. The directive
   is the comment. Do not wrap prose around it.

**This rule covers `src` only.** `vite.config.ts` and `eslint.config.mjs` keep
their comments, because they explain tool behaviour that has no other home, and
because a config file is read by a person deciding whether to change a setting.
`src/styles/globals.css` may keep CSS comments. That asymmetry is deliberate, and
it matches core.

## Tests

**This package has no tests, and adding a framework is a decision, not a
drive-by.** Do not create `*.test.ts`/`*.test.tsx` files as part of unrelated work.

The repo has one test setup, `packages/api/jest.config.cjs`, and it is rooted at
`packages/api`, so it cannot pick anything here up. There is no Vitest anywhere in
the repo, and `packages/core` is documented as deliberately untested. Adding a
runner to studio means adding the repo's first browser-side test story: propose it
on its own, wire it into the root `test` script, and write it up here.

Until then, verification is `format`, `typecheck`, `lint` and the build. See
[Before you hand work back](#before-you-hand-work-back).

## Module style

**Function components. No classes.**

**Declare a component with `export function Name()`.** Never `React.FC`, never an
arrow function assigned to a `const`, and never a default export.

```ts
// src/app.component.tsx
export function App() {
```

**Studio has no default exports at all, and needs none.** This is a real
divergence from core, where `page.tsx`, `layout.tsx` and `route.ts` must default
export because Next requires it. Vite requires it nowhere: `index.html` points at
`src/main.tsx`, which is a side-effecting module with no exports.

**Helpers are plain `function` declarations placed above the component that uses
them.**

**Hooks live in a `use-*.ts` file whose name matches the export**, so
`use-form-draft.ts` exports `useFormDraft`. There are none yet.

## Destructuring

This is the package's most distinctive rule, and the one most likely to look
wrong to someone arriving from ordinary React code.

**Object destructuring is not allowed.** Not in a function signature, not in a
function body, not in a callback parameter.

**Array and tuple destructuring is allowed anywhere**, so React's tuple-returning
hooks are unaffected:

```ts
const [value, setValue] = useState(''); // correct, tuple
```

**A component takes one `props` parameter and reads through it.**

```ts
export function FieldRow(props: { label: string; onRemove: () => void }) {
  return <p>{props.label}</p>;
}

export function FieldRow({ label, onRemove }: {...}) {  // wrong
}
```

**A hook result is named after the thing, then read through**, and **a callback
parameter is named, not destructured.**

Two notes that will save you time:

- **Named imports are not destructuring.** `import { StrictMode } from 'react'` in
  `main.tsx` is correct and unaffected.
- **Do not declare a local just to shorten an expression.** A local that captures
  a stable function reference for a dependency array is a different thing and is
  correct.

**Prop forwarding is the one shape that may use a rest element**, because it has
no non-destructured form that keeps its types. Copy
`packages/core/src/components/declarative-form/supporting/html-text.tsx` if you
need one. Studio has none yet. Do not treat it as licence to destructure named
props.

## Naming

**Files**, kebab-case, with a suffix that names the role:

| Pattern | Denotes |
| ------- | ------- |
| `*.component.tsx` | A hand-written component |
| `*.page.tsx` | A page-level view under `views/` |
| `use-*.ts` | A hook, named for its export |
| `*.types.ts` | A shared type-only module |
| `*-store.ts` | A module-level external store in `lib/`, read through `useSyncExternalStore` |
| `main.tsx`, `vite-env.d.ts` | Vite conventions. The names are fixed |

**Components are PascalCase and match their filename**: `app.component.tsx`
exports `App`.

**A callback prop is `onX`; a handler defined in the component is `handleX`.** A
handler that reads as a verb phrase may use that instead.

**`SCREAMING_SNAKE_CASE` for module constants, and only when reused.**

**Acronyms capitalise as words**: `Html`, `Url`, `Id`, `Json`, `Api`. So
`HtmlText` and `getBackendUrl`. `HTMLCanvasElement` is a platform name, not ours.

## Types

**Use a `type` alias.** There are no `interface` declarations in this package. A
global augmentation must use `interface`; nothing else may.

**Studio does not use the `I` prefix**, matching core and diverging from
`packages/api/AGENTS.md` and `packages/engine/AGENTS.md`. Almost every type here is
a props bag, an options bag or a scalar union, which those two documents exempt
anyway, so the exemption would swallow the rule.

**Types imported from the engine keep their names**, prefix included:
`IRenderableField`, `IDeclarativeForm`. Never re-alias them locally. **Studio
deliberately does not depend on `@declarativeforms/engine`**, and should not
start: see [Known inconsistencies](#known-inconsistencies). Wire shapes are
mirrored as `Api*` types in `src/lib/api.types.ts` instead.

**Types live beside the code that uses them.** Colocate in the component file when
only that file needs it. Promote to a `*.types.ts` module when several files share
it. **Studio has no `types/` directory and does not need one.**

**`Array<T>`, never `T[]`**, in every type position including nested ones:

```ts
export function cn(...inputs: Array<ClassValue>): string {  // correct
export function cn(...inputs: ClassValue[]) {               // wrong, and is
                                                            // what the CLI writes
```

**No `enum`.** **No `any`**: the package has zero occurrences. Opaque values are
`unknown` and narrowed with a type predicate.

## Imports

**Use `import type` for type-only imports**, or the inline `type` modifier when
one module supplies both:

```ts
import { clsx, type ClassValue } from 'clsx';
```

**The import section is one unbroken block.** No blank line between two import
statements.

**Prettier will not do this for you.** It preserves author blank lines inside an
import section, so this is a review rule.

**Use the `@/` alias for anything outside the current folder.** Not "prefer": the
package has **zero** `'../'` imports, and that is the checkable state. Only
same-folder `'./x'` imports are relative, and the only one is the barrel's
`export * from './button';`.

```ts
import { App } from '@/app.component';        // correct
import '@/styles/globals.css';                // correct, side-effect import
import { App } from './app.component';        // wrong from another folder
```

**The `@/` alias is declared twice and both must agree**: `paths` in
`tsconfig.json` and `resolve.alias` in `vite.config.ts`. Vite does not read
tsconfig `paths`, and TypeScript does not read Vite's alias, so a change to one
without the other produces a package that typechecks but does not build, or the
reverse. There is no `vite-tsconfig-paths` here and there should not be; the
explicit alias is one fewer dependency.

**Import a component folder through its barrel, never past it.** This applies to
`@/components/ui`. Two cases are not violations, and both are deliberate:

- **A file inside a barrelled folder imports its siblings directly.** The rule is
  for consumers.
- **`@/lib` has no barrel**, so `@/lib/utils` is the correct form.

**One statement per module.** Merge, rather than importing twice from the same
specifier.

**Order is not enforced by any tool here.** Write it in this order, inside the
single block, and keep a file internally consistent:

1. React
2. Other external packages
3. `@declarativeforms/engine`
4. `@/`-aliased internal modules
5. Relative modules
6. Side-effect imports

## Function signatures

**Annotate the return type of every function, with one exception: a JSX
component.**

Components are exempt because the annotation adds nothing the compiler cannot
already see, and because the correct spelling churns between React versions. There
is no `JSX.Element`, `React.JSX.Element`, `ReactNode` or `ReactElement` return
annotation anywhere in this package, and adding one would be the inconsistency.

Everything else is annotated, including nested handlers and callbacks:

```ts
export function cn(...inputs: Array<ClassValue>): string {
const handlePointerDown = (event: React.PointerEvent): void => {
```

**A hook that returns an object needs a named type**, exported beside it, so
callers and the annotation agree.

## Control flow

**Guard clauses first, happy path last.**

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

**2. A blank line after every guard block.** A guard is an `if` with no `else`
whose body is a single `return`, `continue`, `break` or `throw`. Nothing is added
if the next line is already blank or closes an enclosing block.

Beyond those two, a blank line separates statements with different concerns.
**Never put one immediately after an opening `{`.**

**`??` for nullish defaults, `||` for falsy defaults and boolean logic.**

**Prefer a ternary in JSX over a nested conditional block**, and `&&` for a
render-or-nothing branch.

## Styling

**Tailwind 4, configured entirely in CSS.** There is no `tailwind.config.*` in this
package or anywhere in the repo, and adding one would be the inconsistency.

**Tailwind is wired through `@tailwindcss/vite`, not `@tailwindcss/postcss`.** This
is a real divergence from core, which runs the PostCSS plugin because Next owns its
own CSS pipeline. Studio therefore has **no `postcss.config.mjs`**. Do not add one.

`src/styles/globals.css` is the single stylesheet, imported once, from
`src/main.tsx`. Keep it single. The shadcn CLI globs `**/*.css` and takes the
**first** file containing `@import "tailwindcss"` in filesystem order, so a second
stylesheet makes `components.json`'s `tailwind.css` target a coin flip.

Its three imports are load-bearing and are all written by the CLI:
`tailwindcss`, `tw-animate-css`, and `shadcn/tailwind.css`, which supplies the
`in-data-*` and `has-data-*` utilities that the `radix-nova` primitives compile
against. Removing the third breaks the button's group and icon variants silently,
with no build error.

**Style with Tailwind utility classes and the design tokens.** Use
`bg-background`, `text-foreground`, `border-border` and the rest of the
`@theme inline` names rather than raw colours, so light and dark both work. There
is no per-form runtime theming here; that is core's `lib/theme.ts` and it stays
there.

## Errors

**Throw a plain `Error`.** There are no custom error classes. Sentence case, no
trailing period, a colon before an interpolated value:

```ts
throw new Error(`Form not found: ${response.status}`);
```

**`api-client.ts` decorates a plain `Error` rather than subclassing it.** A
failed request needs a status, an error slug and a field-error map so the UI can
choose copy and offer Retry, and `ApiFailure` is `Error & {...}` built with
`Object.assign`, narrowed by the `isApiFailure` type predicate. That keeps "no
custom error classes" literally true and copies the idiom
`packages/api/src/server.ts` already uses for its rate-limit error. A
`status` of `0` means the request never got an answer, which is the checkable
"we do not know whether the server committed anything" case.

**`console.error` and `console.warn` are permitted inside a `catch` that
recovers**, matching core and api. Do not add a logging library, and do not log
outside a `catch`.

**A caught error is rethrown unchanged when the caller must see it.**

## Formatting

Two separate tools, and they are not interchangeable:

```bash
npm run format   # prettier --write, owns quotes and whitespace
npm run lint     # eslint, owns correctness rules
```

**Prettier is configured by `packages/studio/prettier.config.cjs`, which sets only
`singleQuote: true`.** Everything else is the Prettier 3 default: 80 columns,
semicolons, trailing commas, always-parenthesised arrow parameters. Run
`npm run format` and let it decide. A second run must list nothing.

The file is byte-identical to the three in `packages/core`, `packages/engine` and
`packages/api`, and it has to be: **a config in a sibling package is not
inherited.** Do not delete it.

**The `format` script globs `src/**` only**, so `vite.config.ts`,
`eslint.config.mjs`, `components.json` and `src/styles/globals.css` are not
Prettier-owned. `globals.css` is indented four spaces by the shadcn CLI as a
result. Leave it; reformatting it by hand only guarantees a diff on the next
`shadcn add`.

**Never audit quote style with a bare `grep '"'`.** JSX attributes are
double-quoted by design, and a string containing an apostrophe stays
double-quoted because switching it would mean escaping. Use `prettier --check`.

**ESLint carries `@eslint/js` recommended, `typescript-eslint` recommended,
`eslint-plugin-react-hooks` flat recommended and `eslint-plugin-react-refresh`'s
Vite config**, with one project override. This is the create-vite stack, not
core's: core runs `eslint-config-next`, which is meaningless outside Next. The
project object is scoped to `files: ['**/*.{ts,tsx}']`, and that scope is
load-bearing for the same reason it is in core: `prettier.config.cjs` is a `.cjs`
file in a `type: module` package, and an unscoped object referencing a plugin rule
is a hard config error the moment such a file exists.

**ESLint must report zero errors and zero warnings.** Unlike core, which carries
five standing warnings, studio starts clean. Keep it that way.

## Known inconsistencies

Recorded so you neither copy them nor "fix" them as a drive-by.

- **`react-refresh/only-export-components` is turned off for
  `src/components/ui/**`.** Every shadcn primitive exports its `cva` variants
  (`buttonVariants`) beside the component, which is exactly what that rule
  forbids, so it fires once per primitive and the only fix would be hand-editing
  files the CLI owns. It is turned off rather than downgraded to `warn` because
  the gate above is zero warnings. The reason is recorded in `eslint.config.mjs`
  too.
- **`src/components/ui/button.tsx` is not byte-identical to core's**, even though
  both were generated from `radix-nova`. Studio's was pulled later and the
  registry moved: it uses `rounded-[min(var(--radius-md),10px)]`,
  `in-data-[slot=button-group]` and `has-data-[icon=inline-start]`, where core's
  uses plain `rounded-md` and `has-[>svg]`. Neither is wrong. Do not sync them by
  hand; both are regenerated by their own CLI runs.
- **`src/styles/globals.css` diverges from core's `app/globals.css` in three
  places**, all of them registry evolution rather than choices: the radius scale
  is multiplicative (`calc(var(--radius) * 0.6)`) where core's is additive
  (`calc(var(--radius) - 4px)`); the five chart colours are neutral greys where
  core's are chromatic; and `font-sans` is applied to `html` rather than `body`.
- **The `nova` preset ships a Geist font and studio does not.** `shadcn init`
  wrote `@fontsource-variable/geist` into `dependencies`, an `@import` into
  `globals.css` and `--font-sans`/`--font-heading` into `@theme inline`. All four
  were removed: no other package in this repo carries a font dependency, and core
  loads Inter from a `<link>` instead. `font-sans` therefore resolves to
  Tailwind's default stack. **A future `shadcn init` will reintroduce Geist**, so
  check for it after one.
- **`typescript` is an alias, and `tsc` is a different package.** Studio copies
  `packages/api`'s pins: `"typescript": "npm:@typescript/typescript6@^6.0.2"` and
  `"@typescript/native": "npm:typescript@^7.0.2"`. The reason is
  `typescript-eslint@8`, whose peer range is `>=4.8.4 <6.1.0` and which needs the
  JavaScript compiler API that TypeScript 7 does not ship. `node_modules/.bin/tsc`
  still resolves to `@typescript/native`, so `npm run typecheck` runs TS 7.0.2
  while ESLint sees 6.x. Do not "simplify" this to a plain
  `"typescript": "^7.0.2"`; ESLint's type-aware rules break.
- **ESLint is pinned to `^9.39.5`, not the `^10.9.0` create-vite wrote.** Core is
  on 9, and two ESLint majors in one lockfile is not parity. All three plugins
  accept 9.
- **`optionalDependencies` pins six musl binaries, and one pair is exact.**
  `@tailwindcss/oxide-*-musl` and `lightningcss-*-musl` exist for the same reason
  they do in core: the Alpine build stage cannot resolve them otherwise. The third
  pair, `@rolldown/binding-*-musl`, is studio-only, because Vite 8 is
  Rolldown-based and core's Next build is not. **It is pinned to exactly `1.2.6`,
  matching the `rolldown` version in the root lockfile**, because Rolldown's NAPI
  bindings are pinned to their host version and a floating range loads a
  mismatched binary. Bump `vite` and you must re-check that pin:
  `node -e "console.log(require('./package-lock.json').packages['node_modules/rolldown'].version)"`.
- **`src/vite-env.d.ts` is committed, unlike core's `next-env.d.ts`**, which the
  root `.gitignore` excludes because Next regenerates it. Nothing regenerates
  studio's.
- **`src/views/` has no `index.ts`.** Core records its own views barrel as
  "imported by nothing", so repeating that indirection here would be a knowing
  mistake. `app.component.tsx` imports the views it renders.
- **`@tanstack/react-query` is pinned to core's `^5.102.2` on purpose.** Two
  majors of it in one lockfile would be the same anti-parity this document
  already records for ESLint. Move both packages together.
- **`react-router` covers two routes and nothing more**: `/` and
  `/forms/:formId`, with the branch in `?branch=`. `main` is never written to
  the query string, so a main-branch URL stays clean.
- **Shared client state lives in `lib/*-store.ts` modules read through
  `useSyncExternalStore`, not React context.** The only provider in the tree is
  `QueryClientProvider`. The reason is load-bearing: `api-client.ts` must read
  and clear the bearer token as a plain function call with no React tree above
  it, which is what makes one central `401` path possible.
- **Studio does not depend on `@declarativeforms/engine`, and the read-only YAML
  comes from the API.** The engine's barrel reaches `handlebars`, whose Node
  entry registers `require.extensions`; that is why `packages/core` sets
  `serverExternalPackages: ['handlebars']`, and a browser bundle has no
  equivalent escape hatch. `GET .../branches/:branch/yaml` returns the text the
  server already persists, which also removes the Dockerfile and build-order
  changes a workspace dependency would need.
- **`shadcn add sidebar` and `shadcn add sonner` are both deliberately
  rejected.** `sidebar` writes a generated `src/hooks/use-mobile.ts`, putting
  CLI-owned code into a hand-written directory and breaking the
  `components/ui/` boundary this document rests on; the mobile drawer is `sheet`
  plus Tailwind breakpoints. `sonner` imports `useTheme` from `next-themes`,
  which cannot be removed without hand-editing generated output, so it would
  cost a second npm dependency in a non-Next SPA for one copy confirmation.
  Confirmations are inline instead, where a Retry can actually live.
- **No markdown renderer and no `dangerouslySetInnerHTML` anywhere.** Assistant
  prose is an escaped text node with `whitespace-pre-wrap`. Model and API text
  is untrusted, and this is the only reading of that rule which cannot go wrong.
- **Responsive layout is Tailwind breakpoints only.** There is no
  `useMediaQuery`, so both the desktop rail and the mobile `Sheet` render and CSS
  picks, and there is no first-paint jump.
- **`docker/nginx.conf` is now `docker/default.conf.template`**, expanded by
  envsubst at container start from `/etc/nginx/templates/`. Two consequences:
  `API_INTERNAL_ORIGIN` must always be set or `proxy_pass` expands empty and
  nginx refuses to start (the `Dockerfile` sets a default and `compose.yaml`
  passes one), and no studio environment variable may ever be named `uri`,
  `host`, `scheme` or `request_uri`, because envsubst would eat the nginx
  variables of the same name.
- **The `/api/` block uses a variable upstream plus `resolver 127.0.0.11`.** A
  literal host in `proxy_pass` is resolved once at startup and cached forever,
  so the `updater` service recreating the api container would leave studio
  holding a dead address. The cost is that `127.0.0.11` only answers on a
  user-defined Docker network: under Compose that is always true, but a bare
  `docker run` on the default bridge will `502`. A variable upstream also stops
  nginx forwarding the URI implicitly, hence the explicit `$request_uri`, which
  is the raw client URI and therefore keeps opaque cursors and encoded branch
  names byte-for-byte.
- **lucide-react 1.x ships no brand icons**, so there is no `Github` export. The
  GitHub mark on the sign-in button is a hand-written JSX `<svg>` helper inside
  `src/views/signed-out.page.tsx`. Do not "fix" it to a lucide import, and do not
  add an icon dependency for one glyph.
- **`BrandMark` reads `/favicon-32x32.png` through a plain `<img src>`**, not an
  import. The file lives in `public/`, which Vite does not fingerprint, so the
  path is stable and the same asset serves the favicon and the UI.
- **Studio is absent from the root `test` script**, which runs api only. See
  [Tests](#tests).

## Before you hand work back

Run these, in this order:

```bash
npm run format -w @declarativeforms/studio     # must list nothing on a second run
npm run typecheck -w @declarativeforms/studio  # tsc --noEmit, must pass clean
npm run lint -w @declarativeforms/studio       # eslint, 0 errors and 0 warnings
npm run build -w @declarativeforms/studio      # vite build
```

If you changed anything the other packages consume, also run `npx tsc -b` from the
repository root.

If you changed `package.json`, the `Dockerfile` or anything the image copies, build
it. The Vite build succeeding on macOS proves nothing about Alpine:

```bash
docker build -f packages/studio/Dockerfile -t studio-check .
```

**The `Dockerfile` uses `COPY --chmod`, so it needs BuildKit** (`buildx`). CI has
it; a local daemon without buildx cannot build this image.

**If you changed `docker/default.conf.template`, prove envsubst still produces a
valid config**, because a template error surfaces only at container start:

```bash
docker run --rm -e API_INTERNAL_ORIGIN=http://api:8080 \
  -v "$PWD/packages/studio/docker/default.conf.template:/etc/nginx/templates/default.conf.template:ro" \
  --entrypoint sh nginxinc/nginx-unprivileged:1.27-alpine \
  -c '/docker-entrypoint.sh nginx -t'
```

Then check the diff by hand:

```bash
S=packages/studio/src
grep -rnE '^[[:space:]]*(//|/\*)' $S --include='*.ts' --include='*.tsx'
grep -rnE '[A-Za-z_>][[:space:]]*\[\]' $S
grep -rnE 'const \{|function [A-Za-z]+(<[^>]*>)?\(\{|for \(const \{' $S | grep -v components/ui
grep -rnE 'if \(.*\) (return|continue|break|throw)' $S
grep -rnE ': any|as any|<any>' $S
grep -rn "from '\.\./" $S
```

Expected results, and nothing else:

- **Comments: 1.** The `/// <reference types="vite/client" />` in `vite-env.d.ts`.
- **Destructuring: 0.** **Pipe through `grep -v components/ui`**, or the generated
  primitives drown the signal. Note the `for (const {` arm: a `for...of` binding is
  destructuring too, and a grep that only looks for `} =` will miss it.
- **Relative imports: nothing.** The check is `'../'`, not `'../../'`: a single
  level up is a violation.
- **Everything else: nothing.**

**The three whitespace rules have no linter.** Prettier does not add or remove blank
lines around statements, and it preserves them inside an import section, so these
are checked by reading the diff:

- imports form one unbroken block,
- a blank line precedes every `return` that is not first in its block,
- a blank line follows every guard block.

And confirm by inspection:

- No comment was added beyond a `// TODO:` or a real directive.
- No object was destructured, in a signature or a body.
- Every new non-component function has an explicit return type, and no component
  gained one.
- A new hook that returns an object exported a named type for it.
- Every new module outside the current folder is reached through `@/`.
- A new primitive was added to `src/components/ui/index.ts`.
- `src/components/ui` was changed only by the shadcn CLI or by `npm run format`.
- `src/lib/utils.ts` still reads `Array<ClassValue>` and `: string`.
