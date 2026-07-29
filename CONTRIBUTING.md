# Contributing to Declarative Forms

Declarative Forms is intentionally small and explicit: YAML defines a form,
GitHub stores it, and the application validates and renders it. Contributions
should preserve that operating model and avoid adding a second source of truth
for form definitions.

## Before you start

- Use an issue to describe substantial product or architecture changes before
  implementing them.
- Keep pull requests focused. Do not mix broad mechanical refactors with a
  behavior change.
- Do not include credentials, private form definitions, or real submission data
  in issues, tests, or logs.
- Review [SECURITY.md](SECURITY.md) before reporting a vulnerability.

## Development setup

Requirements:

- Node.js 24 or later
- npm 11 or later
- Docker with Compose for the full local stack

Install dependencies and run the checks:

```bash
npm ci
npm test
npm run lint
npm run build
npm run check:openapi
```

Run the local stack:

```bash
cp .env.example .env
docker compose \
  --env-file .env \
  -f docker/compose.yaml \
  -f docker/compose.local.yaml \
  up --build
```

The web application is available at `http://localhost:3000` and the API health
endpoint at `http://localhost:3001/health`.

## Repository layout

- `packages/core` parses, validates, compiles, and evaluates form definitions.
- `packages/react` maps the validated model to React field components.
- `packages/api` retrieves GitHub YAML and handles operational submission data.
- `packages/web` resolves public form URLs and hosts the renderer.
- `examples` and `templates` contain executable YAML examples.
- `docs` contains the user and contributor documentation.

See [the architecture guide](docs/contributing/architecture.mdx) for the
request-to-render path.

## Changing the YAML specification

The YAML format is a public API. A schema change must include:

1. a compatibility assessment and migration guidance when existing files change;
2. runtime validation in `packages/core`;
3. focused parser and validator tests;
4. an updated YAML reference and relevant field guide;
5. updated examples; and
6. a passing documentation-example contract test.

Unknown keys are rejected. Do not document a property until the runtime accepts
and tests it.

## Adding or changing a field type

Keep the change traceable across the existing boundaries:

1. update the canonical types and validator in `packages/core`;
2. add or update the React component and explicit field registry in
   `packages/react`;
3. test parsing, validation, compilation, and rendering;
4. add or update a complete YAML example; and
5. document defaults, validation, and accessibility behavior.

Avoid adding a plugin framework or dynamic discovery mechanism for a single
field.

## Pull requests

Describe:

- the concrete user or maintainer problem;
- the smallest behavior change that solves it;
- compatibility and security considerations;
- the exact commands you ran; and
- any checks you could not run.

Pull requests should preserve GitHub as the source of truth for form definitions
and should not add a required database-backed form management path.

