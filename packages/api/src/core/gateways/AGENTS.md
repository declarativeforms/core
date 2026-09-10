# API gateway standards

## Purpose

`gateways` isolates outbound APIs and delivery mechanisms such as GitHub,
OpenAI, Resend, and Turnstile.

## Architecture

- Gateways translate domain primitives/contracts into third-party requests and
  translate responses back into shared contracts or primitives.
- Third-party wire shapes remain private to the gateway file.
- Gateways never import services, repositories, routes, or Fastify concerns.
- Retries, domain policy, and workflow decisions belong in services unless the
  remote protocol itself requires them.

## Naming

- Gateway files use the bare integration concept without a suffix.
- Classes use `<VendorOrCapability>Gateway`.
- Public methods name the remote capability: `getX`, `findX`, `sendX`, `verify`,
  or `generate`.
- Use product casing for vendors, including `GitHub` and `OpenAi` as established
  by existing class names.

## Coding standards

- Return `null` or `false` only for established remote outcomes that the caller
  safely handles. Do not add scalar failure variants merely to select HTTP
  statuses; required configuration and dependency failures propagate or throw
  plain `Error`.
- Keep request and response casts local. Move only cross-layer return contracts
  to `types`.
- Set explicit request method, headers, caching behavior, and body shape.
- Read vendor configuration at its use site and expose `isConfigured` when a
  service needs to branch on availability.
- Keep transactional emails self-contained, accessible, and usable without
  remote images; provide plain text when HTML is sent.
- Do not add a client library when platform `fetch` already covers the protocol.

## Verification

- Confirm success, non-success response, and malformed/absent payload paths.
- Confirm gateway contract changes are reflected in strategies and services.
- Confirm no third-party wire type leaked into the shared types barrel.
