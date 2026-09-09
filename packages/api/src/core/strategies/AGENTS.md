# API strategy standards

## Purpose

`strategies` contains interchangeable implementations selected by type, such as
OAuth providers and submission connection delivery.

## Architecture

- A strategy adapts a common application contract to one concrete behavior.
- Strategies may delegate protocol work to gateways but never reach into routes
  or repositories.
- The container assembles strategy arrays; services select a strategy by its
  `type` discriminant.

## Naming

- Files end in `*.strategy.ts`; classes end in `Strategy`.
- Each strategy exposes a readonly string `type` discriminant.
- Contract methods follow the capability vocabulary used by their gateway and
  consumer, such as `getAccessToken` and `findUser`.
- Interfaces are `I`-prefixed and named for the capability family.

## Coding standards

- Keep interfaces only where multiple implementations are expected or already
  exist; rely on structural typing instead of adding `implements` clauses.
- Declare explicit return types and access modifiers on every method.
- Keep strategy methods thin when a gateway already owns the protocol.
- Do not add a strategy factory; construct strategies directly in the container.
- Keep third-party wire types in gateways and shared cross-layer contracts in
  `types`.

## Verification

- Confirm each strategy satisfies its interface structurally.
- Confirm its discriminant is unique in the container array.
- Trace contract renames through the interface, implementation, gateway, and
  consuming service.
