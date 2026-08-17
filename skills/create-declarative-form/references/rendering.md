# Rendering and repository behavior

Use this reference to predict what a form will do after its YAML is committed.

## Contents

- [Repository lookup](#repository-lookup)
- [Render pipeline](#render-pipeline)
- [Sections and navigation](#sections-and-navigation)
- [Field behavior](#field-behavior)
- [Conditions, templates, and localization](#conditions-templates-and-localization)
- [Submissions and connections](#submissions-and-connections)
- [Pre-commit walkthrough](#pre-commit-walkthrough)

## Repository lookup

The hosted renderer reads a `.yaml` file from a GitHub repository. A form URL is:

```text
https://frms.dev/<owner>/<repository>/<path-without-.yaml>
```

For `forms/customer-feedback.yaml` in `acme/forms`, use:

```text
https://frms.dev/acme/forms/forms/customer-feedback
```

Add `?branch=<branch-name>` to render a non-default branch and `&embed=true`
to remove page chrome for an iframe. URL-encode branch names. Other query
parameters prefill fields whose IDs match them. Reserved parameters are
`embed`, `lang`, `submission_id`, `step`, and `branch`.

The public `frms.dev` instance can read public GitHub repositories. Private
repositories require a self-hosted instance configured with read-only GitHub
Contents access. Never add a write token to form YAML.

GitHub is the form source of truth. A commit is the deployment, although
GitHub's raw-content cache can make a new revision take a few minutes to appear.
The renderer expects `.yaml`, not `.yml`.

## Render pipeline

The engine applies four stages:

1. Parse YAML.
2. Resolve localized text for the active locale.
3. Compile templates, conditions, validators, options, and navigation against
   the current answers.
4. Render one active section.

Parsing checks YAML syntax but does not strictly validate the schema. Unknown
field and connection types are dropped; unknown keys are ignored. Missing IDs
become empty strings. Therefore, perform the semantic checks in `SKILL.md`
instead of treating a successful YAML parse as sufficient.

The server assigns the top-level form `id`. Do not author it. Always author
unique, stable IDs for sections and fields.

## Sections and navigation

- The first section is the entry page.
- Only one section renders at a time.
- Completing a section validates its visible fields, saves its answers, and
  follows `next`.
- Missing `next` and `next: done` both complete the form.
- A target beginning with `https://` redirects externally. An `http://` target
  is treated as a section ID and is therefore invalid.
- Conditional `next` rules are checked top to bottom. Put an `else` fallback
  last.
- Back navigation replays the current answer-dependent path from the first
  section. Keep section graphs acyclic and make every target reachable.
- Partial answers are stored after each completed section.

Use one section for a short form. Split a longer form by respondent task, not
by arbitrary field count. Put easy, low-sensitivity questions first.

## Field behavior

| Type                         | Runtime behavior                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `short_text`                 | Single-line text input. `min_length` and `max_length` become character limits.                                                |
| `long_text`                  | Multi-line input with optional character limits.                                                                              |
| `email`                      | Browser email input plus authored validators.                                                                                 |
| `url`                        | Browser URL input.                                                                                                            |
| `mobile_number`              | Telephone-style input; add `pattern` when format constraints matter.                                                          |
| `number`                     | Whole, non-negative digits in the current renderer. Do not use for decimals or negative values.                               |
| `date`, `date_month`, `time` | Native date/month/time controls. String `min` and `max` become bounds.                                                        |
| `single_select`              | Radio-style one-of-many choice.                                                                                               |
| `multiple_select`            | Checkbox-style many-of-many choice; numeric `min`/`max` constrain selection count.                                            |
| `dropdown`                   | Select menu; `searchable: true` adds search.                                                                                  |
| `rating`                     | Integer scale, defaulting to 1–5; numeric `min`/`max` change its endpoints.                                                   |
| `hidden`                     | No visible control. Use query-string prefilling for campaign or context values.                                               |
| `file_upload`                | Uploads to configured object storage. With no `max`, or `max: 1`, the answer is one URL; with a larger `max`, it is an array. |
| `camera`                     | Captures an image, defaulting to the rear camera.                                                                             |
| `signature`                  | Draw-to-sign control.                                                                                                         |
| `geolocation`                | Captures latitude and longitude and shows a map preview.                                                                      |
| Address family               | Uses Google Places when configured and plain text otherwise. `outputFormat: structured` stores an address object.             |

Choice option objects display `label` but store `value`. Keep stored values
stable when updating forms because expressions, integrations, and historical
submissions may depend on them.

Hidden-by-condition fields are removed from the active section's submitted
values. Do not depend on a value from a field that the same answer path hides.

## Conditions, templates, and localization

`visible_when`, conditional `next`, conditional completion, connection `when`,
and expression validators evaluate JavaScript-style boolean expressions with
answers under `data`:

```text
data.contact_method === 'Email' && data.age >= 18
```

Use only comparisons, parentheses, `&&`, `||`, and `!`. Quote string values
exactly as stored by their options. Treat a missing or invalid expression as
false. Avoid computation, function calls, mutation, and access outside `data`.

Templates use `{{data.field_id}}`. They are supported in form and section text,
field labels/placeholders/options, completion text, and email connection text.
Reference only fields available by the point the text is shown.

Localized text resolves in this order: exact locale, base language, `en`, then
the first non-empty translation. `?lang=<locale>` overrides the form locale.
When adding localization to an existing form, translate all respondent-facing
text consistently rather than mixing maps and untranslated strings casually.

## Submissions and connections

The API stores partial and completed answers. File, camera, and signature data
use configured object storage. Connections run server-side through the
scheduler:

- `webhook` posts submission JSON to its URL.
- `email` uses the deployment's configured Resend account.
- `trigger_on` defaults to `completed`; `partial` and `any` can emit more than
  one delivery per respondent.
- `delay_minutes` is a non-negative integer.

Never invent webhook URLs, email recipients, analytics tokens, or secrets. Add
such configuration only when the user supplies it or it already exists and the
requested update clearly preserves it.

## Pre-commit walkthrough

Mentally render at least these states:

1. Empty form on the first section.
2. Every choice that controls `visible_when`.
3. Every conditional navigation branch.
4. Back navigation from each reachable section.
5. Every conditional completion outcome.
6. Required, minimum, maximum, and cross-field validation failures.
7. The final completion or redirect.

For an update, repeat the walkthrough for the behavior that existed before the
change as well as the new path.
