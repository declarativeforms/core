# Coding Standards

Use this file as the default prompt and reference for any coding agent working in this repository.

This repo has style drift today. Follow the rules in this file over incidental local formatting unless a stronger package-local instruction explicitly overrides them.

## Scope

These standards apply to code only:

- TypeScript
- TSX
- JavaScript config files
- tests
- barrel files

These standards do not define MDX or YAML authoring rules.

## Core Defaults

- Use single quotes everywhere.
- Use semicolons everywhere.
- Prefer direct, pragmatic code over abstraction-heavy code.
- Prefer readable local implementation over speculative reuse.
- Preserve semantic reading flow over mechanical cleverness.
- Existing repo code is not automatically precedent.

## Imports And Exports

- Group imports in this order:
  1. built-in and external packages
  2. aliased internal imports such as `@/...`
  3. relative imports
- Alphabetize within each group.
- Leave one blank line between groups.
- Apply the same sorting discipline to barrel exports when practical.
- Keep barrel files flat and easy to scan.

Example:

```ts
import fastify from 'fastify';
import type { FastifyReply } from 'fastify';

import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';

import { getContainer } from '../core';
import { requireStudioAuth } from './middleware';
```

## File And Member Organization

- Keep the main exported or public flow near the top.
- Put supporting helpers after the main flow.
- In classes, keep private methods at the bottom.
- Alphabetize peer functions or methods only when it does not harm semantic reading order.
- Semantic grouping wins over strict alphabetical ordering for functions and methods.

## Spacing And Layout

- Use structured vertical spacing.
- Separate setup, guards, main work, and return or render sections with blank lines.
- Avoid dense walls of code.
- Avoid decorative extra whitespace.
- Keep short blocks compact.
- Add blank lines because they improve scanability, not because they fill space.

## Control Flow

- Prefer early returns.
- Prefer explicit `if` blocks for non-trivial branching.
- Use ternaries only for simple value selection or very small render branches.
- Avoid nested ternaries.
- Avoid deeply nested control flow when a guard clause makes the path clearer.

Example:

```ts
if (!token) {
  reply.status(401).send({ error: 'Unauthorized' });
  return;
}

const user = await authService.verify(token);

if (!user) {
  reply.status(401).send({ error: 'Unauthorized' });
  return;
}
```

## Naming And Variables

- Avoid ceremonial local names.
- Do not default to names like `result`, `data`, `value`, `parsed`, `currentX`, `nextX`, or similar transition names when a clearer domain name or direct expression is available.
- Allow short generic names only when the scope is tiny and the meaning is obvious.
- Avoid unnecessary locals.
- Do not create a local variable just to name something used once unless the name materially improves readability.
- Do not rename something into a longer name unless the extra length adds real meaning.

Prefer:

```ts
const user = await authService.verify(token);
```

Over:

```ts
const result = await authService.verify(token);
```

## Destructuring

- Avoid destructuring by default.
- Especially avoid destructuring transient payloads and request-like objects.
- Do not default to destructuring `request.body`, `request.params`, or similar short-lived payload objects.
- Prefer direct property access when the source object matters for readability.
- Allow destructuring when it is genuinely clearer and the returned shape is stable enough to justify it.
- `getContainer()` is an allowed exception when it improves readability.

Prefer:

```ts
const token = request.body.token;
const requestId = request.body.request_id;
```

Over:

```ts
const { token, request_id: requestId } = request.body;
```

Acceptable:

```ts
const { authService, studioMagicLinkService } = await getContainer();
```

## Constants And Extraction

- Extract a constant only when it is reused, domain-significant, or materially improves readability.
- Keep one-use literals and config objects inline by default.
- Do not extract a constant just to avoid repeating a literal once.
- Keep top-level constants for durable domain values, shared configuration, or real reuse.
- Avoid one-off `nextX`, `currentX`, or `tempX` objects unless they make a dense block meaningfully clearer.

Prefer:

```ts
await fetch(getBackendUrl('auth/github'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code }),
});
```

Over:

```ts
const requestOptions = {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code }),
};

await fetch(getBackendUrl('auth/github'), requestOptions);
```

## Helpers And Abstraction

- Avoid helper extraction by default.
- Extract only when logic is reused, the extracted name carries real domain meaning, or the inline block is too dense to read comfortably.
- Prefer direct local implementation over extra utility layers.
- If a feature is only used in one place, keep it local by default.
- Do not add abstractions for hypothetical future reuse.

## React And Component Rules

- Keep small event handlers inline.
- Extract handlers only when reused or when the inline block becomes materially harder to scan.
- Avoid `useCallback` and `useMemo` by default.
- Use `useCallback` or `useMemo` only when there is a real identity or performance reason, a dependency-management reason, or a clearly established local pattern that actually needs it.
- Prefer plain derived locals over memoized derived locals.
- Prefer direct component logic over hook-heavy indirection.
- In Studio code, prefer page-local queries, mutations, and save flow.
- Do not create custom hooks for one-page flows unless reuse is real and meaningful.

Prefer:

```tsx
<Button
  onClick={() => {
    logout();
    navigate('/login', { replace: true });
  }}
/>
```

Over:

```tsx
const handleLogoutClick = useCallback(() => {
  logout();
  navigate('/login', { replace: true });
}, [logout, navigate]);

<Button onClick={handleLogoutClick} />
```

## Services, Repositories, And Routes

- Keep services compact and direct.
- Prefer obvious request flow over layered indirection.
- Use early-return validation and authorization guards in routes.
- Keep repository methods small and predictable.
- In classes, keep public API methods first and private methods at the bottom.
- Avoid empty constructors and boilerplate that add no value.

## Comments

- Use comments almost never.
- Do not add banner comments, section-divider comments, or docblocks that narrate obvious behavior.
- Do not comment code that can be made self-explanatory by naming or structure.
- Only keep a comment when the code cannot reasonably explain a non-obvious decision or behavior by itself.

Remove patterns like:

```ts
// Helpers
// Main render with autocomplete
// Fetch suggestions effect
```

## Anti-Patterns To Avoid

- package-by-package quote or semicolon drift
- destructuring every object by habit
- one-use constants and config objects
- one-use helper functions that hide straightforward logic
- ceremonial local names
- nested ternaries
- defensive `useMemo` and `useCallback`
- banner comments and obvious narration
- abstractions created for hypothetical reuse

## Working Principle

Readable code in this repo means:

- fewer one-use names
- fewer extracted helpers
- clearer guard flow
- cleaner vertical spacing
- less default destructuring
- less defensive memoization
- more direct code that can be understood in one pass

When choosing between a clever abstraction and a direct implementation, prefer the direct implementation.
