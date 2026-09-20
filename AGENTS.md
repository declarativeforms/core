# Repository: agent instructions

## Purpose

This repository contains the Declarative Forms monorepo, its documentation,
examples, deployment configuration, and the API, core, and engine packages.
These instructions make the repository's coding standards mandatory for coding
agents.

## Scope and authority

This file governs the repository root and every descendant directory. More
specific `AGENTS.md` files also apply within their directories and take
precedence for local rules.

Before making any change, read `docs/CODING_STANDARDS.md`. Its rules are the
canonical target within the scope it declares. For method or function guidance
covered by that document, its explicit precedence rules override conflicting
package guidance. Compiler constraints, public contracts, security
requirements, and data-integrity requirements remain authoritative.

## Responsibilities and boundaries

Keep root documentation and configuration consistent with the three workspace
packages. Follow each package's own `AGENTS.md` for its architecture, generated
code boundaries, tests, and local conventions.

Do not broaden a requested change into repository-wide conformance work.
Existing non-conforming callables are legacy code: do not copy them, and update
them only when their declaration or behavior is materially changed or when the
task explicitly requests broader alignment.

## Standards

### Coding and workflow

- Apply every applicable `MUST`, `MUST NOT`, and `REQUIRED` rule in
  `docs/CODING_STANDARDS.md`.
- Treat `SHOULD` and `SHOULD NOT` as strong defaults; deviate only for a
  concrete requirement of the current change.
- Review each new or materially changed named callable as a complete contract,
  including its name, parameters, return type, implementation, and callers.
- Use the narrowest verification required by the coding standards and the
  applicable package instructions.
- Do not add compatibility aliases, migrations, abstractions, or unrelated
  cleanup unless the task requires them.

## Validation checklist

- Every changed file follows this file and the nearest applicable `AGENTS.md`.
- Every new or materially changed named callable satisfies the full review
  checklist in `docs/CODING_STANDARDS.md`.
- Legacy code outside the requested change remains untouched.
- Required package checks pass, or the handoff identifies each check that could
  not run and why.

## Verification

From the repository root, always run:

```bash
git diff --check
```

For changes under `packages/api`, `packages/core`, or `packages/engine`, also
run the exact commands, in order, from the applicable package `AGENTS.md` and
the conformance boundary in `docs/CODING_STANDARDS.md`. Formatting commands may
write files; run them a second time when the instructions require a clean
result. Manually inspect semantic rules that tooling cannot verify.
