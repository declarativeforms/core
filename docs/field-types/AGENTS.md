# AGENTS.md

These instructions apply to all files under `docs/field-types/`.

## Purpose

The `field-types` directory is for lightweight, YAML-first pages that each document one field type or one tightly related field family.

These pages should help a reader quickly copy and adapt a working YAML example for a specific field type.

## Relationship to Other Docs

- Foundational setup belongs in `docs/getting-started/`.
- Task-based workflows belong in `docs/examples/`.
- `docs/field-types/` is specifically for field-type coverage.

## Format

Keep every field-type page minimal and consistent.

Preferred structure:

1. Frontmatter with a short `title`
2. One short intro sentence linking back to `create-a-form`
3. One expanded YAML block that does the teaching
4. Nothing else unless a tiny clarification is necessary

Do not add:

- step-by-step walkthroughs
- long explanations before or after the example
- troubleshooting sections
- verification checklists
- long option tables

## Content Rules

Each page should stay focused on the field type.

- Use one page per field type by default.
- A small field family can share a page when the types are closely related.
- Keep unrelated features out of the example.
- If the field type has specific supported options, show them in the YAML.
- Only keep shared properties when they are meaningful for how the field is actually used or rendered.
- If a field type has meaningful variants, keep them in the same page by expanding the YAML rather than splitting the page.
- Field-type completeness should cover field-specific properties and sensible validators, but should not try to showcase `visible_when`.

## YAML Guidance

The YAML example is the page.

- Use a full form when that keeps the page easier to copy.
- Keep ids and labels simple unless realism improves clarity.
- Use YAML comments sparingly when they help explain a field-specific behavior.
- Show the full supported shape of the field type where relevant.
- Show field-specific properties and validator variants from the real implementation in `core`, but prefer sensible usage over merely accepted schema combinations.
- Prefer one expanded YAML block over multiple smaller examples.
- When a field supports different value shapes, show those variants directly in the YAML.
- Include `expression` validators when they genuinely make sense for the field type.
- Remove validators that are technically accepted by the schema but do not make practical sense for the field type.

Examples:

- `email` should show `otp` and `block_free_email`
- `dropdown` should show `options` and `searchable`
- `rating` should show `min_label` and `max_label`
- `camera` should show `facing_mode`
- address-related pages should clearly show the supported address field types
- select-style pages should show both string options and `{ label, value }` options
- validators should show `message` variants where the schema supports them
- small enum-style differences should usually be explained with comments rather than duplicate example fields
- select-style pages should use separate field variants when the `options` shape materially changes
- enum-like differences such as `front` vs `rear` should use comments instead of duplicate fields

## Writing Style

Be direct and quiet.

- Use short titles such as `Short text`, `Email`, or `Address fields`
- Keep the intro sentence short
- Let the YAML do most of the work
- Avoid filler copy and narrative setup

## Naming

- Keep filenames lowercase and hyphenated
- Match filenames to field-type names where possible
- Use one dedicated index page for the ordered list of links
