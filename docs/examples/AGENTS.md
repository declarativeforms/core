# AGENTS.md

These instructions apply to all files under `docs/examples/`.

## Purpose

The `examples` directory is for lightweight, task-based examples.

Each page should help a reader solve one small, concrete task by copying or adapting a YAML example. These pages are not tutorials, not reference docs, and not product marketing pages.

## Audience

Assume the reader wants to get to a working YAML example quickly.

- They may have landed here directly from search.
- They may not have read the getting started page yet.
- They do not want a long walkthrough.

## Format

Keep every page minimal and consistent.

Preferred structure:

1. Frontmatter with a short `title`
2. One short intro sentence
3. One YAML code block that does most of the teaching
4. Nothing else unless a tiny clarification is necessary

Default pattern:

```md
---
title: "Task name"
---

If you have not created a form before, start with [Create a form](/getting-started/create-a-form).

```yaml form.yaml
...
```
```

Only add a second non-YAML block when the task itself requires showing an output shape, such as a webhook payload or a final example URL.

Do not add:

- step-by-step walkthroughs
- long explanations before or after the example
- troubleshooting sections
- verification checklists
- multiple alternatives on the same page
- conceptual deep dives better suited to reference docs

## Content Rules

Each page should demonstrate exactly one idea.

- Keep the task narrow and explicit.
- Do not mix several new concepts into one example.
- If a page is about sections, do not also teach branching, integrations, localization, or templating unless the task absolutely requires it.
- If supporting YAML is required to make the example valid, keep it generic and do not discuss it unless it is the point of the page.
- For topics with multiple meaningful variants, keep those variants in the same YAML example when that helps the reader understand the full authoring surface.

Prefer examples that make the objective obvious.

- Start simple and abstract when that improves clarity.
- Use generic ids like `section_1` or `question_1` when realism would distract from the concept.
- Use realistic business examples only when the feature needs real-world context to make sense.
- Use plain titles, labels, and descriptions unless specificity materially improves the example.

## Writing Style

Be direct and quiet.

- Use short titles such as `Add another section`, `Add conditional logic`, or `Send submissions to email`.
- Keep the intro sentence short.
- Let the YAML carry the explanation whenever possible.
- Prefer YAML comments over prose when a small explanation is needed.
- Do not use filler copy or narrative setup.
- Keep comments directly tied to the behavior being taught.

## YAML Guidance

The YAML example is the page.

- Make the snippet copyable.
- Keep it as short as possible while still showing the task clearly.
- Use comments sparingly and only where they make the key behavior easier to understand.
- Keep names, labels, and descriptions plain unless variation is necessary for the example.
- Do not add extra fields, sections, or connections that are unrelated to the task.
- Do not keep placeholder text like `Lorem ipsum` in example content.
- Default to `section_1` and `question_1` style ids unless a more specific id materially improves clarity.

When choosing between a partial snippet and a full form:

- Prefer a full form if it keeps the page easier to copy and understand.
- Prefer a partial snippet only when the page is specifically about a tiny isolated block and the surrounding structure would add noise.

## Naming

Use task-based filenames and titles.

- Filenames should be lowercase, hyphenated, and action-oriented.
- Titles should match the task in plain language.
- One file should map to one task.

Examples:

- `add-another-section.mdx`
- `add-conditional-logic.mdx`
- `use-a-file-upload-field.mdx`
- `send-submissions-to-email.mdx`

## Boundaries

`docs/examples/` is for examples only.

- Foundational setup belongs in `docs/getting-started/`.
- Exhaustive behavior, schema details, and edge cases belong in reference docs.
- If a page starts reading like a tutorial, shorten it.
- If a page starts reading like a spec, move that material elsewhere.
