# API repository standards

## Purpose

`repositories` is the persistence layer. It maps domain data to MongoDB queries
and mutations without deciding business policy.

## Architecture

- Repositories depend on MongoDB and shared types, never on services, routes,
  gateways, or strategies.
- Services choose business actions and call repositories using persistence
  operations and stored-field criteria.
- Repositories own projections, indexes, filters, atomic writes, and persistence
  timestamps.

## Naming

- A repository class already names its entity; do not repeat it in method names
  or parameters unless it refers to a different entity or distinguishes
  multiple identifiers.
- `findByX` returns one entity or `null`.
- `findAllByX` returns a collection and an empty array when nothing matches.
- Use `insert`, `upsert`, `replace`, `update`, `delete`, and `setX` for writes.
  `upsert` means insert-or-replace; `replace` must not conceal an upsert. Do not
  use business verbs such as `consume`, `publish`, or `reschedule`.
- Parameters are camelCase versions of persisted criteria; stored fields remain
  `snake_case`.

## Coding standards

- Exclude MongoDB `_id` from every returned domain object.
- Return `null` for missing singular reads and `Array<T>` for collection reads.
- Writes return only the direct value current callers need: entity, boolean,
  count, or `void`. Never add a read merely to enrich a write result.
- Keep business validation and authorization in services.
- Read the current clock inside a repository when recording persistence time.
  A caller-provided domain timestamp such as `runAt` remains a parameter.
- Preserve atomic filters for optimistic concurrency and uniqueness.
- Use tags for extensible classification and avoid indexes containing parallel
  array paths.
- Keep one repository class per `*.repository.ts` file and export it from the
  alphabetical barrel.

## Verification

- Inspect every query for the intended filter, projection, sort, and limit.
- Confirm renamed methods leave MongoDB operations and persisted shapes
  unchanged.
- Search for repository collection methods beginning with `list` and business
  mutation verbs; expect none unless explicitly documented.
