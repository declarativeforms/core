# AGENTS.md template

Use this structure for directory-scoped agent instructions. Replace brace-style
placeholders with repository facts. Required sections must contain meaningful
content. Include optional sections only when they change how an agent works in
the target directory.

## Section contract

| Order | Section                         | Requirement | Purpose                                                                                                  |
| ----- | ------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| 1     | Title                           | Required    | Name the governed scope and identify the file as agent instructions.                                     |
| 2     | Purpose                         | Required    | Explain what the directory contains and why it exists.                                                   |
| 3     | Scope and authority             | Required    | Define coverage, inheritance, precedence, audience, and whether rules describe current or desired state. |
| 4     | Responsibilities and boundaries | Required    | State what code or content here owns and must not own.                                                   |
| 5     | Contents                        | Conditional | Add when the file is long or has enough sections that navigation materially helps.                       |
| 6     | Standards                       | Required    | Hold the directory-specific rules under relevant subsections.                                            |
| 7     | Examples                        | Optional    | Demonstrate a non-obvious rule with a concrete local example.                                            |
| 8     | Known exceptions                | Optional    | Record intentional or legacy deviations without making them precedents.                                  |
| 9     | Validation checklist            | Required    | Provide observable acceptance checks for agents and reviewers.                                           |
| 10    | Verification                    | Required    | Give exact runnable commands and required manual checks.                                                 |

## Canonical skeleton

````markdown
# {Scope}: agent instructions

## Purpose

{What this directory contains, why it exists, and who or what consumes it.}

## Scope and authority

{The paths governed by this file, applicable ancestor instructions, precedence,
audience, normative vocabulary, and how disagreements between code and this
document are treated.}

## Responsibilities and boundaries

{What belongs here, what does not, dependency direction, ownership boundaries,
and interactions with adjacent directories or systems.}

## Contents

{Optional navigation for a long document. Omit this section when it does not
materially help.}

## Standards

### {Relevant standard category}

{Concrete, verifiable rules. Add further standard subsections only when the
target needs them.}

## Examples

{Optional minimal examples for rules that prose alone does not make
unambiguous.}

## Known exceptions

{Optional intentional or legacy deviations, why they are exceptions, and
whether an agent may modify or copy them.}

## Validation checklist

- {Observable condition that must be true before accepting work.}

## Verification

```bash
{Exact commands, in execution order, with the required working directory clear.}
```

{Manual checks, expected failures or warnings, conditional checks, and what the
agent must report when a check cannot run.}
````

The outer fence above illustrates the finished Markdown.

## Standard subsections

Under `## Standards`, select only the categories the target needs and keep them
in this relative order:

1. **Architecture and layout** — directory map, ownership, dependency direction,
   generated code, barrels, registration, and public surface.
2. **Naming** — files, directories, exports, identifiers, routes, and persisted
   or public fields.
3. **Interfaces and contracts** — APIs, types, schemas, inputs, outputs,
   compatibility, and method semantics.
4. **Behavior and workflow** — execution order, state transitions, data flow,
   lifecycle, and integration behavior.
5. **Coding or authoring standards** — imports, functions, control flow,
   formatting, comments, content rules, and allowed tools.
6. **Errors, security, and edge cases** — failure ownership, trust boundaries,
   disclosure rules, recovery, and invariants that tools cannot express.

Use more specific subsection names when the domain benefits from them. Preserve
the relative order rather than adding an empty category for uniformity.

## Writing rules

- Keep rules local to the governed directory and compatible with ancestor
  instructions.
- Lead with the rule, then give only the rationale needed to apply it correctly.
- Separate requirements from recommendations and current facts.
- State paths relative to the repository root unless another base is explicit.
- Use concrete examples for naming transforms, subtle boundaries, or formats;
  do not duplicate straightforward prose as examples.
- State both sides of an architectural boundary: what belongs here and where
  excluded behavior belongs instead.
- Make conditional rules name their trigger, required action, and exception.
- Describe verification failures and known warnings so agents do not hide or
  misattribute them.
- Do not include generic software advice, aspirational scaffolding, empty
  headings, or rules unsupported by repository evidence or user requirements.
- For an existing `AGENTS.md`, preserve every rule and example while
  standardizing its placement and wording.

## Authority rules

The Scope and authority section must answer:

- Which directory and descendants does this file govern?
- Which ancestor `AGENTS.md` files also apply?
- Which instruction wins when local and ancestor guidance differ?
- Is the document descriptive of current code, a canonical target, or both with
  named exceptions?
- Is the audience an internal coding agent, an external content-authoring agent,
  or another specific consumer?

Do not assume the same answers across directories.

## Verification rules

Verification must be proportional to the target and copied from real project
configuration. Include:

- Exact commands in required order and the directory from which to run them.
- Conditional commands triggered by specific file or interface changes.
- Expected standing warnings or failures that are not caused by the task.
- Manual checks for important rules that automation does not enforce.
- The required handoff when a command cannot run.

Do not invent a test command, install a checker, or require a full-repository
build without repository or user evidence.
