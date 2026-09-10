# API type standards

## Purpose

`types` contains shared contracts that cross files or architectural layers.

## Architecture

- Domain entities and cross-layer contracts belong here.
- Third-party request/response envelopes stay private to their gateway.
- One-file implementation details stay inline or local to that file.
- `index.ts` is a flat alphabetical barrel with no declarations.

## Naming

- Files are kebab-case bare concepts with no `.type` suffix.
- Shared shapes use an `I`-prefixed PascalCase name.
- Persisted fields use `snake_case`; non-persisted in-memory contracts use the
  naming established by their application boundary.
- Use `type` aliases for shapes and unions. Reserve `interface` for class
  contracts, which normally live beside strategies.

## Coding standards

- Use `Array<T>`, never `T[]`; use `unknown`, never an unconstrained `any`.
- Use string-literal unions instead of enums.
- Keep fields in logical/domain order rather than alphabetical order.
- Give generic parameters a default when most callers omit them.
- Do not create one-use result, summary, or DTO wrappers. Use an inline `Pick`
  when a caller needs only part of an entity.
- Shared validation issues and direct scalar outcome unions are contracts, not
  result wrappers, when multiple layers consume them directly.
- A genuine cursor page may have a shared page type because its cursor belongs
  to the query rather than an entity.

## Verification

- Confirm every new type has more than one file/layer consumer.
- Confirm its file is exported alphabetically from `index.ts`.
- Search for `T[]`, enums, unapproved `any`, and project types ending in
  `Result`, `Summary`, or `Dto`.
