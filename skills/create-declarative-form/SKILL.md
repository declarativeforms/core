---
name: create-declarative-form
description: Create or update Declarative Forms YAML in the user's current repository and explain how to preview it through a compatible renderer. Use when an agent is asked to make a form, survey, questionnaire, registration, application, intake, feedback flow, or lead form; translate a user's objective into form questions and logic; modify an existing Declarative Forms .yaml file; diagnose form structure or rendering behavior; or produce a repository-native form that can be reviewed and committed.
---

# Create Declarative Form

Create or update a form as a local `.yaml` file in the user's repository. Keep
Git as the source of truth. Do not require MCP, hosted write access, or a
service-owned form record.

## Load the right references

- Read [references/schema.md](references/schema.md) completely before writing or
  editing form YAML. It is the full version 1 schema.
- Read [references/rendering.md](references/rendering.md) when choosing field
  behavior, navigation, conditions, localization, connections, or a render URL.
- Read [references/form-design.md](references/form-design.md) for every new form,
  substantial redesign, or vague objective.
- If the target repository explicitly documents a newer schema or different
  renderer, reconcile that local documentation before editing and report any
  incompatibility.

## Work in the user's repository

1. Inspect the repository before choosing a file.
   - Find existing Declarative Forms `.yaml` files and repository guidance.
   - Inspect the requested file if it exists.
   - Infer the GitHub owner and repository from `git remote` only when needed
     for the render URL.
   - Inspect the current branch without changing it.
2. Resolve the target.
   - Use the exact path the user gives.
   - For a new form without a path, choose a concise kebab-case filename ending
     in `.yaml`, normally at the repository root or beside existing forms.
   - Never use `.yml`; the renderer appends `.yaml`.
   - Do not overwrite an ambiguous existing file. Ask which file only when
     repository evidence cannot resolve the target safely.
3. Preserve unrelated changes. Check the working tree and edit only the intended
   form and explicitly requested supporting documentation.
4. Do not commit, push, publish, or call external integrations unless the user
   explicitly requests that additional action.

## Translate intent into a form

Determine the audience, desired outcome, necessary answers, completion
experience, and any real delivery requirement. Infer routine wording and layout.
Ask a concise question only when missing information would materially change
data collection, branching, privacy, or delivery.

For a new form:

- Start with `version: 1`.
- Add a clear title, a short purpose-setting description when useful, at least
  one section, stable section and field IDs, and a completion screen.
- Use lowercase snake_case IDs. Keep every section ID unique and every field ID
  unique across the whole form.
- Choose the most specific field type.
- Collect only what the outcome requires and make only indispensable fields
  required.
- Use one section for a short form. Split longer forms into coherent respondent
  tasks.
- Put simple questions first and sensitive or high-friction requests later.
- Add logic only when it removes irrelevant questions or creates a genuinely
  different path.
- Do not add placeholder webhooks, recipients, analytics tokens, consent text,
  or secrets.

For an existing form:

- Preserve its purpose, formatting style, comments, IDs, option values,
  localization, theme, measurements, dates, connections, and unaffected paths.
- Treat field IDs and stored option values as compatibility contracts.
- Trace every expression, template, `next` target, completion rule, and
  connection before renaming or deleting anything.
- Prefer a focused patch over rewriting the file.
- Do not silently broaden the requested change.

## Validate before handoff

Parse the YAML with an available local parser. In this product repository,
`js-yaml` is available through the existing Node dependencies. In another
repository, prefer its own YAML tooling; do not add a dependency merely to
validate one form unless the user agrees.

Then perform all semantic checks below:

- The top level is a mapping with `version: 1` and a non-empty `sections` list.
- Do not author a top-level `id`.
- Every section and field has a non-empty, unique ID.
- Every field type is in the bundled schema and has its required type-specific
  properties.
- Choice fields have meaningful options; option values used by logic exactly
  match their expressions.
- Every `next` target is `done`, an existing section ID, or an `https://` URL.
- Conditional navigation has a final fallback and contains no cycles.
- Every `data.<id>` reference points to an existing field with a compatible
  value shape.
- Every template references an answer available when the text is shown.
- Required and optional choices match the user's objective.
- Validator kinds and value types match the field behavior.
- Conditional completion rules put the unconditional fallback last.
- Connections contain real, user-approved destinations and valid triggers.
- Localized respondent-facing text has sensible fallbacks.
- No secrets or repository credentials appear in the YAML.

Validate the file against the published JSON Schema before reporting back.
It is generated from the engine, so it is the authoritative contract and it is
strict about unknown keys:

```bash
check-jsonschema --schemafile https://frms.dev/schema.json <path>
```

If `check-jsonschema` is not installed (`pip install check-jsonschema`), say so
rather than skipping the step quietly: the modeline below still gives the author
validation in their editor.

Add the modeline as the first line of every form you write, so the author's
editor validates it too:

```yaml
# yaml-language-server: $schema=https://frms.dev/schema.json
```

Mentally render representative answer paths using the walkthrough in
[references/rendering.md](references/rendering.md). For an update, cover both
the changed path and the previously supported paths. If the target repository
has relevant tests or a renderer command, run them.

## Report the result

Return:

- The created or updated path.
- A short summary of the form's respondent flow and important decisions.
- Validation performed and any behavior that could not be verified locally.
- The prospective render URL when a GitHub remote is known:

  `https://frms.dev/<owner>/<repo>/<path-without-.yaml>`

- Add `?branch=<urlencoded-current-branch>` for a non-default branch preview.
- State that the file must be committed and pushed before the hosted renderer
  can read it.
- Warn that public `frms.dev` requires a public repository; private
  repositories need a suitably configured self-hosted instance.
