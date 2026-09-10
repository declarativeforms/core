# API core standards

## Purpose

`core` is the application facade and composition root. It exposes services and
their contracts to the presentation layer while keeping domain and
infrastructure code separated by directory.

## Architecture

- `container.ts` constructs dependencies in order and memoizes one container.
- `index.ts` is the flat facade used by routes.
- Services may depend on repositories, gateways, strategies, and other genuine
  services. Infrastructure layers never depend on services.

## Naming

- `Container` fields are named after concrete classes and listed in construction
  order; the returned object is alphabetized by key.
- Composition-root locals may qualify two instances of the same class, such as
  the verification token service.
- Barrel exports are flat and alphabetical where they are simple lists.

## Coding standards

- Keep the hand-written container; do not add a dependency-injection framework.
- Construct each dependency once, after everything it requires.
- Resolve the container lazily and reset it to `null` after disposal.
- Expected domain outcomes use direct values. Plain `Error` is reserved for
  terminal failure, and routes select HTTP status codes from direct outcomes.
- Cross-layer data shapes belong in `types`, not `container.ts` or a barrel.
- Apply package rules for return values, imports, comments, and formatting.

## Verification

- Confirm construction order matches dependency order and every container field
  appears in the returned object.
- Confirm routes can import all required public core symbols through `index.ts`.
- Confirm no repository, gateway, or strategy imports a service.
