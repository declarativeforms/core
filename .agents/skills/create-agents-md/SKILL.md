---
name: create-agents-md
description: >
  Create a directory-scoped AGENTS.md by analyzing a provided repository
  directory and optional requirements. Use when asked to document agent rules,
  boundaries, conventions, or verification for a specific directory. If the
  target already has AGENTS.md, preserve its rules while standardizing it.
---

# Create AGENTS.md

Create an accurate, directory-specific `AGENTS.md` from repository evidence and
the user's requirements.

## Inputs

- **Target directory:** Required. Resolve it relative to the current working
  directory unless the user supplies an absolute path.
- **Requirements:** Optional. Treat the remaining user input as desired scope,
  constraints, conventions, or changes to make canonical.

If the target is missing or multiple directories plausibly match, ask for the
directory. Do not guess or create a new product directory merely to hold an
`AGENTS.md`.

## Required reference

Read [references/agents-template.md](references/agents-template.md) completely
before drafting or editing the target file. Use its section order and omit only
the sections it marks optional.

## Analyze the target

1. Resolve the repository root and target directory.
2. Read each applicable ancestor `AGENTS.md` from the repository root down to
   the target.
3. Read the target's existing `AGENTS.md` completely when one exists. Inventory
   every rule, example, exception, command, and boundary before restructuring
   it.
4. Inspect the target's manifests, configuration, entrypoints, exports, public
   interfaces, generated-code boundaries, and verification commands.
5. Trace representative implementation flows and search all relevant files
   before declaring a pattern universal. Ignore dependencies, generated build
   output, and unrelated dirty-worktree changes.

Resolve discoverable facts from the repository. Ask the user only about intent
that materially changes the rules and cannot be inferred safely.

## Decide what becomes a rule

- Explicit user requirements define the desired canonical state.
- Compiler, formatter, linter, schema, and manifest configuration are stronger
  evidence than incidental code style.
- Repeated, coherent patterns may become local rules after checking for
  counterexamples.
- Do not turn one implementation, outlier, or historical accident into a
  universal requirement.
- Put intentional incompatibilities and legacy deviations under Known
  exceptions. State whether they may be copied, changed only in scoped work, or
  left untouched.
- Refer to inherited rules instead of duplicating them unless a local
  restatement prevents a concrete ambiguity.
- Include concrete paths, symbols, commands, or examples when they make a rule
  objectively verifiable.
- Do not invent architecture, commands, tests, dependencies, or future
  requirements that the repository and user input do not establish.

## Write the file

Create `<target-directory>/AGENTS.md` using the required reference.

If the file already exists, preserve the meaning of every current rule,
example, exception, and verification instruction. Reword and relocate content
only to fit the template or remove ambiguity. Never silently weaken or delete a
rule.

Keep the guidance scoped to the target directory. Prefer direct, imperative
language and use MUST, MUST NOT, SHOULD, and SHOULD NOT only when their strength
is intentional. Omit empty optional sections and placeholder prose.

Modify only the target `AGENTS.md` unless the user explicitly requests other
changes. Do not rewrite source or configuration to make it conform; record
established deviations under Known exceptions.

## Validate and report

- Confirm the file's scope and precedence are explicit.
- Confirm every claim is supported by the repository or user input.
- Confirm an existing file lost no rule, example, exception, or command.
- Confirm optional sections are present only when useful.
- Confirm commands use the correct working directory and actually exist.
- Format the Markdown with the repository's formatter when available, then run
  `git diff --check` for the target file.
- Report the created or updated path, the evidence inspected, and verification
  performed. Mention unresolved uncertainty instead of presenting it as a rule.
