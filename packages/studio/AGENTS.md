# AGENTS.md

These instructions apply to all files under `packages/studio/`.

## Purpose

Studio is an internal editing surface.

Build pages and components to be readable, understandable, and maintainable first. Favor direct implementation over abstraction-heavy patterns.

## Reference

Use `src/pages/form-editor.page.tsx` as the current source of truth for page structure, state ownership, save flow, and general coding style.

## Core Style

- Keep implementation pragmatic and local.
- Do not over-engineer.
- Prefer straightforward React state and direct data flow over helper layers.
- Write code that is easy to scan in one pass.
- If a feature is only needed in one page, keep it in that page by default.

## Pages

- Default to page-led implementation.
- Keep most logic, state, queries, mutations, and submit behavior in the page.
- Extract only small, focused components when that clearly improves readability.
- If a component is extracted, keep it narrow in scope and easy to understand from its props alone.

## Data Fetching

- For page-specific behavior, place TanStack `useQuery` and `useMutation` directly in the page.
- Do not create custom hooks for one-page fetch or save flows.
- Keep query and mutation setup close to where the data is used.
- If the page depends on fetched data and no loading UI is required, return `null` while loading.

## Forms

- Use `react-hook-form` directly in the page for editable page state like settings forms.
- Initialize form state from loaded API data after the query resolves.
- Keep form values simple unless the task explicitly requires something richer.
- Prefer plain string editing for text-like properties unless the feature specifically requires localization or richer value handling.

## State Ownership

- The page owns the persisted data shape.
- Child components may own local UI state such as expand/collapse.
- Child components should push data changes back up through props instead of owning a second saved-data source.
- Keep save behavior centralized in the page.

## Components

- Prefer native Studio UI primitives from `@/components`.
- Use Tailwind utility classes only to support layout, spacing, and light visual adjustment.
- Keep spacing consistent with existing `Field`, `FieldGroup`, `Item`, and `ItemGroup` patterns.
- Extract components only when they are small, focused, and materially improve readability.

## Editing Rules

- Do not add behavior the task did not ask for.
- Do not add helper normalization or formatting layers unless they are explicitly needed.
- Keep implementation close to how the page already works.
- If a field or property is specified as non-editable, render it as display-only.
- Do not introduce locale-aware editing, advanced abstractions, or generalized builders unless the task requires them.

## Event Handlers

- Inline small interactions when that keeps the code clearer.
- Do not split trivial button behavior into separate methods without a clear readability benefit.

## Save Flow

- Assemble the API payload in the page from current page state and form state.
- Do not scatter persistence logic across several layers.
- Keep one obvious save path per page where possible.

## Do

- Keep code direct, local, and readable.
- Prefer page-local TanStack queries and mutations for page-local behavior.
- Use small extracted components only when they simplify the page.
- Keep saved data flowing from child components back into page state.
- Follow the patterns already established in `form-editor.page.tsx`.

## Do Not

- Do not over-engineer.
- Do not introduce custom hooks for one-page flows.
- Do not add extra helper abstractions that were not requested.
- Do not generalize for future use cases unless there is a present need.
- Do not change editability rules without an explicit requirement.
- Do not hide straightforward logic behind indirection.
