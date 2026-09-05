# Declarative Forms: agent instructions

This file teaches a coding agent to build and maintain forms for **Declarative
Forms**, a platform where a form is a YAML file in a Git repository.

If you are an agent that has been pointed at this file, you are about to write
or edit a `.yaml` form in the user's repository. Read the URL contract and the
runtime notes before you write anything. They describe behaviour that the JSON
Schema cannot express, and most authoring mistakes come from not knowing them.

- Machine-readable schema: <https://frms.dev/schema.json>
- Human reference: <https://frms.dev/SCHEMA.md>
- Index of everything: <https://frms.dev/llms.txt>

The JSON Schema is generated from the engine, so it is authoritative. Where this
document and the schema disagree, the schema is right.

## Contents

- [The 60-second version](#the-60-second-version)
- [How a file becomes a URL](#how-a-file-becomes-a-url)
- [Authoring workflow](#authoring-workflow)
- [The schema](#the-schema)
- [Behaviour the schema cannot express](#behaviour-the-schema-cannot-express)
- [Designing a good form](#designing-a-good-form)
- [Changing a form that already has responses](#changing-a-form-that-already-has-responses)
- [Validate before you hand it back](#validate-before-you-hand-it-back)
- [What to report](#what-to-report)

## The 60-second version

Write this to `forms/contact.yaml` in any public GitHub repository:

```yaml
# yaml-language-server: $schema=https://frms.dev/schema.json
version: 1
title: "Contact us"
description: "Send us a message and we will get back to you."

sections:
  - id: contact
    title: "Your details"
    fields:
      - id: full_name
        type: short_text
        label: "Full name"
        placeholder: "Jane Smith"
        validators:
          - required

      - id: email
        type: email
        label: "Email address"
        validators:
          - required

      - id: message
        type: long_text
        label: "Message"
        validators:
          - required
          - type: min_length
            value: 20
            message: "Please write at least 20 characters."

    next: done

completion:
  title: "Thanks, {{data.full_name}}"
  message: "We received your message and will reply to {{data.email}}."
```

Commit it. It renders at `https://frms.dev/<owner>/<repo>/forms/contact`.

That is the whole product. For a simple form you can stop reading here.

## How a file becomes a URL

```
https://frms.dev/your-org/your-repo/forms/signup?branch=draft&embed=true
                 └───────┘└───────┘└──────────┘  └──────────┘└─────────┘
                  owner     repo      file path      branch      options
```

Rules that will bite you if you skip them:

- **Leave off the extension.** The server appends `.yaml`. The URL for
  `forms/signup.yaml` is `/owner/repo/forms/signup`.
- **Use `.yaml`, never `.yml`.** Only `.yaml` is appended, so a `.yml` file is
  never found.
- **Nested paths work.** `forms/2026/signup.yaml` is
  `/owner/repo/forms/2026/signup`.
- **`?branch=` defaults to the literal `main`,** not to the repository's own
  default branch. A repository on `master` or `develop` returns "not found"
  unless you pass `?branch=master`. Always check the default branch before you
  give the user a URL. URL-encode branch names that contain `/`.
- **The public instance reads public repositories only.** A private repository
  needs a self-hosted instance with a `GITHUB_TOKEN`.
- **A commit is a deploy.** Forms are fetched with no caching on each request.
  GitHub's own raw-content CDN can still lag a couple of minutes.

### Query parameters

| Parameter | Effect |
| --- | --- |
| `?branch=` | Render from a branch. See the warning above. |
| `?embed=true` | Render without page chrome, for an `iframe`. |
| `?lang=` | Override the form's `locale`. |
| anything else | Prefills the field whose `id` matches the parameter name. |

`embed`, `lang`, `submission_id`, `step`, and `branch` are reserved and never
treated as prefill. `submission_id` and `step` are written back by the app as
sections are saved, so a refresh resumes where the respondent left off. A
restored answer takes precedence over a URL prefill.

Prefilling is how a `hidden` field captures campaign data:

```
https://frms.dev/acme/forms/signup?utm_source=newsletter&email=jane@example.com
```

The same file on two branches is two separate forms with separate responses.

## Authoring workflow

1. **Look at the repository first.** Find existing form YAML files and follow
   their conventions: directory, naming, comment style, quoting. Read
   `CLAUDE.md`, `AGENTS.md`, or contributor docs if they exist.
2. **Resolve the target file.** Use the exact path the user gave. Without a
   path, pick a short kebab-case filename ending in `.yaml`, next to existing
   forms or at the repository root. Do not overwrite a file whose purpose is
   unclear: ask which file instead.
3. **Put the modeline on line 1.**

   ```yaml
   # yaml-language-server: $schema=https://frms.dev/schema.json
   ```

   This gives the author inline errors and completion in VS Code, Neovim, and
   JetBrains IDEs.
4. **Never author a top-level `id`.** The server assigns it, and the schema
   rejects it.
5. **Edit only what was asked.** Preserve unrelated changes in the working tree.
6. **Do not commit, push, or call any integration** unless the user asks. Leave
   the diff for them to review.

## The schema

One YAML file describes the whole form. `sections` is the only required
top-level key.

The schema is **strict**: `additionalProperties: false` applies at every level,
so an unknown or misspelled key is an error, not a silently ignored one. A
`min_lenght`, a `searchable` on a non-dropdown, or a stray `helpText` all fail
validation.

### Top-level keys

| Key | Type | Description |
| --- | --- | --- |
| `version` | integer | Schema version. Use `1`. |
| `title` | localized text | Shown on the start page. Supports templating. |
| `description` | localized text | Short text under the title on the start page. |
| `start` | object or `false` | The start page. `false` skips it. |
| `sections` | array | **Required.** At least one section. |
| `completion` | object or array | The screen shown after submission. |
| `connections` | array | Webhooks and emails fired on submit. |
| `start_date` | `YYYY-MM-DD` | Before this date the form shows a "not yet open" notice. |
| `end_date` | `YYYY-MM-DD` | After this date the form shows a "closed" notice. |
| `locale` | string | Default language code, for example `en`. |
| `theme` | object | `primary`, a 3- or 6-digit hex accent color. |
| `measurements` | object | `mixpanel` and/or `posthog` analytics config. |

**Localized text** is either a plain string or a map of language code to string:

```yaml
title:
  en: "Contact us"
  de: "Kontaktiere uns"
```

Resolution order is the active locale, then its base language, then `en`, then
the first non-empty value.

### Required keys, at a glance

| Object | Required |
| --- | --- |
| form | `sections` |
| section | `id`, `fields` |
| field | `id`, `type` |
| webhook connection | `type`, `url` |
| email connection | `type`, `to`, `subject` |

### Sections and navigation

A section is one page, validated and saved as a step. Its `title` and
`description` are the heading shown at the top of that page.

```yaml
sections:
  - id: attendee
    title: "About you"
    description: "So we know who is coming."
    fields: []
    next:
      - when: "data.ticket === 'VIP'"
        go: vip
      - else: done
```

`next` is either a single target or a list of rules evaluated top to bottom.
The first truthy `when` wins, and `else` is the fallback. A target is a section
`id`, the literal `done`, or an absolute `https://` URL that redirects the
respondent. Omitting `next` finishes the form.

**Give every section a `title`.** The form `title` is not repeated above the
fields: a section with neither `title` nor `description` renders no heading at
all.

### The start page

Before the first section the respondent sees a start page: the form `title`, the
form `description`, and a button. It is on by default and needs no
configuration, and it is omitted only when the form has neither a `title` nor a
`description`.

Add a `start` block to override any of the three. Each key falls back to the
form-level value, so set only what should differ.

```yaml
title: "Speaker application"
description: "Applications close on 30 June."

start:
  title: "Apply to speak"
  description: "Six questions, about five minutes."
  button: "Start"
```

The form `title` stays the document title even when `start.title` replaces the
heading. All three keys are localized text and support templating, so a URL
prefill can address the respondent by name.

Set `start: false` to send the respondent straight into the first section. Do
that for a short embedded form where the host page already carries the heading,
or when an extra click is not worth it.

The respondent returns to the start page with the **Back** button on the first
section. A resumed form (`?step=`) opens on the saved section, not the start
page.

### Field types

All 22 types. Every field also accepts `id`, `type`, `label`, `placeholder`,
`validators`, and `visible_when`.

| `type` | Renders as | Type-specific keys |
| --- | --- | --- |
| `short_text` | Single-line input | none |
| `long_text` | Textarea | none |
| `email` | Email input | `otp` |
| `url` | URL input | none |
| `mobile_number` | Telephone input | none |
| `number` | Numeric input | none |
| `hidden` | Nothing, captures a value | none |
| `date` | Date picker | none |
| `date_month` | Month and year picker | none |
| `time` | Time picker | none |
| `single_select` | Radio-style, stores a string | `options`, `allow_other` |
| `multiple_select` | Checkbox-style, stores an array | `options`, `allow_other` |
| `dropdown` | Select menu | `options`, `searchable` |
| `rating` | 1 to 5 scale | `min_label`, `max_label` |
| `file_upload` | File picker, uploads to object storage | `accepted_mime_types` |
| `camera` | Live camera capture | `facing_mode` (`front`/`rear`) |
| `signature` | Draw-to-sign pad | none |
| `address` | Full-address autocomplete | `outputFormat` |
| `address_locality` | City autocomplete | `outputFormat` |
| `address_region` | State or region autocomplete | `outputFormat` |
| `address_country` | Country autocomplete | `outputFormat` |
| `geolocation` | Latitude and longitude, with a map | none |

`options` entries are either a bare string, used as both label and value, or an
object with a separate `label` and `value`:

```yaml
options:
  - "General enquiry"
  - label: "1 to 10 people"
    value: "1-10"
```

`outputFormat` is `string` (default) or `structured`. `structured` stores an
object with `formatted_address`, `place_id`, and where available
`street_number`, `route`, `locality`, `administrative_area_level_1`, `country`,
and `postal_code`.

Set `otp: true` on an email field when the respondent must prove ownership of
the address before continuing. The runtime sends a six-digit code and stores
the successful proof token in a generated hidden field named
`<email-id>_token`. Do not author that companion field yourself.

### Validators

Rules run in order and the first failure is shown. Every rule takes an optional
`message` to override the default text.

| Rule | Shape |
| --- | --- |
| Required | `required`, or `{ type: required }` |
| Pattern | `{ type: pattern, regex }` |
| Min length | `{ type: min_length, value }` |
| Max length | `{ type: max_length, value }` |
| Min | `{ type: min, value }` |
| Max | `{ type: max, value }` |
| Expression | `{ type: expression, expression }` |

```yaml
validators:
  - required
  - type: min_length
    value: 20
    message: "Please write at least 20 characters."
```

The inline-flow shorthand `validators: [required]` is valid too.

Read [the `min`/`max` notes below](#behaviour-the-schema-cannot-express) before
using them. They do not do what you probably expect on a text field.

### Expressions

Five keys take an expression: `visible_when` on a field, `when` inside a `next`
rule, `when` on a completion rule, `when` on a connection, and `expression`
inside an expression validator.

An expression is a JavaScript boolean expression. The only variable in scope is
`data`, an object holding every answer keyed by field `id`.

```yaml
visible_when: "data.newsletter === 'Yes'"
when: "data.age >= 18 && data.country === 'DE'"
expression: "data.confirm_email === data.email"
```

Keep them to comparisons and boolean logic. They are for conditions, not
computation.

### Templating

`{{data.field_id}}` placeholders resolve in the form `title` and `description`,
the `start` `title`, `description`, and `button`, a section `title` and
`description`, a field `label` and `placeholder`, option labels, a rating's
`min_label` and `max_label`, the completion `title`, `message`, and button
`label` and `url`, and an email connection's `to`, `subject`, and `body`.

### Completion

Either one object, or a list of rules where the first truthy `when` wins. A rule
with no `when` is the default, so it must come last.

```yaml
completion:
  - when: "data.respondent_type === 'Business'"
    title: "Thanks, {{data.org_name}}"
    message: "Our team will reach out."
  - title: "Thanks, {{data.full_name}}"
    message: "We will reply to {{data.email}}."
    button:
      label: "Back to site"
      url: "https://example.com"
```

### Connections

There are exactly **two** connection types: `webhook` and `email`. There is no
Airtable, Notion, Zapier, Slack, or Google Sheets integration. Do not invent
one, and do not write a connection type that is not in this list: unknown types
are silently dropped at render time.

```yaml
connections:
  - type: webhook
    url: "https://example.com/hooks/new-lead"
    when: "data.newsletter === 'Yes'"
    trigger_on: completed
    delay_minutes: 30

  - type: email
    to: "team@example.com"
    subject: "New response from {{data.full_name}}"
    body: "A new response came in."
    include_responses: true
```

| Key | Applies to | Description |
| --- | --- | --- |
| `url` | webhook | Where to POST the submission as JSON. |
| `to` | email | Recipient. Supports templating. |
| `subject`, `body` | email | Support templating. |
| `include_responses` | email | Append a table of every answer. `hidden` fields are left out. |
| `when` | both | Only deliver when this expression is truthy. |
| `trigger_on` | both | `completed` (default), `partial`, or `any`. |
| `delay_minutes` | both | Non-negative integer. Defaults to `0`. |

`partial` delivers after every section save but not on completion. `any` does
both. Use them deliberately: a multi-section form produces several deliveries
per respondent.

Email requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL` on the server. Never put
a placeholder webhook URL, recipient, analytics token, or secret in a form. Ask
the user for the real destination or leave the connection out.

## Behaviour the schema cannot express

This is the section worth reading twice. Everything here is real engine
behaviour that a schema file cannot describe.

### Mistakes fail silently

- **Parsing does not validate.** Unknown field and connection types are dropped,
  and unknown keys are ignored. A typo does not raise an error: the field simply
  does not appear. The JSON Schema is the only place an authoring mistake is
  ever reported, which is why validating is not optional.
- **A broken expression evaluates to `false`.** Expressions run through
  `new Function('data', ...)`. Anything that throws, including reaching through
  a missing value such as `data.a.b` when `a` is undefined, is caught and
  becomes `false`. A misspelled field id in a `visible_when` means the field is
  never shown, with no error anywhere.

### Identifiers

- Field and section ids must match `^[A-Za-z_][A-Za-z0-9_]*$`. **Hyphens are not
  allowed**, because ids are dereferenced as `data.<id>`. Use `snake_case`.
- Option **values** have no such restriction. `1-10` and `200+` are fine.
- Filenames may be kebab-case. Ids may not.
- Field ids must be unique across the whole form, not just within a section.
- The `_token` suffix is reserved for verification proofs. Every field with
  that suffix is required and its value is validated as a proof token bound
  to the form, source field id, and source value. An email field with `otp: true`
  generates and reserves `<field-id>_token` automatically.

### Validators behave differently per type

- `min` and `max` are **honoured only on** `number`, `date`, `date_month`,
  `time`, `rating`, `file_upload`, and `multiple_select`. On any other type they
  are silently discarded. For text, use `min_length` and `max_length`.
- On `multiple_select` and `file_upload`, `min`/`max` are a **count** of
  selections or files, not a value.
- On `rating`, `min`/`max` **define the scale** rather than validate it. A
  rating field always gets bounds, defaulting to 1 and 5, even with no
  validators. A `min` below 1, or a `max` below `min`, is ignored.
- A numeric bound compares numerically. A string bound compares lexically, which
  is what makes `"2026-10-01"` work on a date field.
- `number` gets an implicit `^\d+$` whole-number check **unless you supply your
  own `pattern`**. Negatives and decimals need one.
- `email` has **no** implicit format check unless `otp: true` is set. Add a
  `pattern` validator when an unverified email field needs format validation.
- `pattern` is **not anchored for you**, and an empty value passes it. In a
  double-quoted YAML scalar the backslash must be doubled:
  `regex: "^\\+?[0-9 ()-]{7,20}$"`.
- Empty values pass every rule except `required` and count-based `min`/`max`, so
  an optional field is only flagged once the respondent starts filling it in.

Default messages, which `message` overrides:

```
{{label}} is required.
{{label}} is invalid.
{{label}} must be at least {{min}} characters.
{{label}} must be at most {{max}} characters.
{{label}} must be on or after {{min}}.
{{label}} must be on or before {{max}}.
{{label}} must be a whole number.
{{label}} must be at least {{min}}.
{{label}} must be at most {{max}}.
{{label}} requires at least {{min}} file(s).
{{label}} allows at most {{max}} file(s).
{{label}} requires at least {{min}} selection(s).
{{label}} allows at most {{max}} selection(s).
```

### Visibility and navigation

- Hiding a field with `visible_when` **drops it from the section being filled**.
  Its answer is not submitted with that section, and it is never required. An
  answer already saved by an earlier section survives, because partial saves are
  merged. **Do not depend on a value from a field that the same answer path
  hides.**
- Only `https://` is treated as an external `next` target. An `http://` target
  is looked up as a section id and will not be found.
- Back navigation replays the answer-dependent path from the first section, so
  **the `next` graph must be acyclic**. A cycle breaks the back button.
- Conditional `next` rules need a final `else`. Without a matching rule, the
  form finishes.

### Storage shapes

- `file_upload` stores a **single URL string** with no `max` or with `max: 1`,
  and an **array** with any larger `max`. Downstream consumers care about this.
- `single_select` stores a string. `multiple_select` stores an array.
- Empty defaults: `file_upload` and `multiple_select` start as `[]`; `camera`,
  `geolocation`, and `signature` start as `null`; everything else starts as `""`.

### Client-side only

These are enforced in the browser and not by the server. A direct API call
bypasses them.

- `start_date` and `end_date`
- `accepted_mime_types`

The per-file size cap is server configuration, not part of the form.

### Naming and security

- `outputFormat` is the **one authored key that is camelCase**. Everything else
  is snake_case.
- A webhook `url` is readable by anyone who can load the form definition.
  Requests are not signed, and custom headers are not supported. Do not put a
  secret in the URL.
- Templating is Handlebars with escaping turned off, and email bodies are sent
  as HTML. A respondent's answer interpolated into completion text or an email
  body is **not escaped**. Treat it as untrusted.
- Address fields use Google Places when a Maps key is configured, and fall back
  to plain text entry when it is not. They always work.

## Designing a good form

Deciding what to ask is most of the job. The schema will not stop you building
a form nobody finishes.

### Start from the outcome

Before writing YAML, settle five things: who is answering, what the user will do
with the responses, which answers are genuinely needed for that, what the
respondent should see when they finish, and whether anything must be delivered
somewhere. Ask a clarifying question only when the answer would change the data
collected, the branching, privacy, or delivery. Infer routine wording yourself.

### Choose the field type deliberately

- Use the most specific type available. `email` and `date` beat `short_text`.
- `single_select` for a short visible list. `dropdown` for a long one, with
  `searchable: true` past roughly ten options.
- `multiple_select` only when more than one answer is genuinely possible. Bound
  it with count `min`/`max` when the number matters.
- `rating` for a scale. Label both ends with `min_label` and `max_label`.
- `number` for whole, non-negative quantities, unless you add your own `pattern`.
- `long_text` when you want a sentence or more. `short_text` otherwise.
- `hidden` for values that come from the URL, never for something the respondent
  should see.
- Reach for `camera`, `signature`, `geolocation`, and `file_upload` only when
  the outcome truly needs them. They ask a lot of the respondent.

### Control effort and bias

- Collect only what the outcome requires. Every extra field costs completion.
- Make only indispensable fields required.
- Put easy questions first and sensitive or high-friction ones later.
- One section for a short form. Split longer forms along coherent respondent
  tasks, not arbitrary field counts.
- Write neutral labels. Do not lead the respondent toward an answer.
- Order options neutrally, and use `allow_other: true` rather than forcing a
  bad fit.
- Add logic only when it removes irrelevant questions or creates a genuinely
  different path.

### Common shapes

| Purpose | Typical shape |
| --- | --- |
| Contact or support | One section, name, email, topic, message. |
| Feedback or survey | Ratings first, then one open comment. Mostly optional. |
| Event registration | Attendee details, then a branch per ticket type. |
| Application | Several sections, file upload, a clear completion screen. |
| Lead qualification | Short first section, branch on segment, hidden UTM fields. |
| Intake or request | Request type first, then fields conditional on it. |

### Write the completion screen

It is the last thing the respondent sees. Say what happens next and when. Use
`{{data.field_id}}` to acknowledge them by name. Add a `button` when there is a
genuinely useful next step.

## Changing a form that already has responses

Treat **field ids and stored option values as data contracts**. Existing
responses are keyed by them, and renaming one orphans the history.

Before renaming or deleting anything, trace every place it is referenced:

- `visible_when` expressions
- `when` inside `next` rules
- `when` on completion rules and connections
- `expression` validators
- `{{data.field_id}}` templates
- `next` targets, including `go` and `else`

Then:

- Preserve the file's existing purpose, formatting, comments, localization,
  theme, measurements, dates, connections, and every path you were not asked to
  change.
- Prefer a focused patch over rewriting the file.
- Adding a field is safe. Removing one loses the answer. Changing a field's
  `type` can invalidate stored answers.
- Changing an option's `value` breaks both stored data and any expression
  matching on it. Change the `label` instead when you only want new wording.
- Do not silently broaden the requested change.

## Validate before you hand it back

**Always validate against the published schema.** Parsing does not, so this is
the only check that catches a typo.

```bash
check-jsonschema --schemafile https://frms.dev/schema.json forms/contact.yaml
```

Install it with `pip install check-jsonschema`. If you cannot run it, say so
rather than skipping the step quietly.

Then check by hand what the schema cannot:

- Every section and field id is unique and matches `^[A-Za-z_][A-Za-z0-9_]*$`.
- There is no top-level `id`.
- Every `data.<id>` in an expression or template points at a field that exists
  and holds a compatible shape.
- Every template references an answer that is already available when that text
  is shown.
- Every `next` target is `done`, an existing section id, or an `https://` URL.
- Conditional `next` has a final fallback and the graph has no cycles.
- Option values used in expressions match the options exactly, character for
  character.
- Validator kinds suit the field type. No `min` on a text field.
- Conditional completion puts the unconditional rule last.
- Connections point at real, user-approved destinations.
- No secrets or credentials appear anywhere in the file.

Finally, walk the form as a respondent. Trace at least the default path and each
branch, and confirm every required field is reachable on the path that needs it.
For an edit, walk the paths that already worked as well as the changed one.

## What to report

Tell the user:

1. The path you created or changed.
2. A short description of the respondent flow and any decisions you made.
3. What you validated, and anything you could not verify locally.
4. The render URL, once the file is committed and pushed:
   `https://frms.dev/<owner>/<repo>/<path-without-.yaml>`, adding
   `?branch=<branch>` when the branch is not `main`.
5. That the file must be committed and pushed before the URL works, and that the
   public instance requires a public repository.
