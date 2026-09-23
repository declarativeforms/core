# Form schema reference

A Declarative Forms form definition is a single YAML file maintained in
GitHub. It describes the form Declarative Forms renders: fields, sections,
navigation, validation, completion screens, and connections. Submissions
contain the respondent's answers and are stored separately by Declarative
Forms, not in the repository.

This document is the reference for the form definition: top-level keys, field
types, validators, and the expressions used for logic and templating.

If you are just getting started, read the [README](./README.md) first. Two
ready-to-copy examples ship in this repo:
[`contact.yaml`](./examples/contact.yaml) (minimal) and
[`kitchen-sink.yaml`](./examples/kitchen-sink.yaml) (every feature).

For authoring and publishing, see [Get Started in the README](./README.md#get-started).
This readable reference explains the format for manual authors. Coding agents
and editors can use the [maintained JSON Schema](https://frms.dev/schema.json),
which includes constraints, descriptions, and examples. Both references follow
the engine types and runtime; the JSON Schema is maintained alongside them,
not generated automatically.

Add this comment to your YAML for completion and validation in compatible editors:

```yaml
# yaml-language-server: $schema=https://frms.dev/schema.json
```

YAML syntax checking alone does not validate a form definition. An available
JSON Schema validator can check parsed YAML against the schema. For example,
if `check-jsonschema` is available:

```bash
check-jsonschema --schemafile https://frms.dev/schema.json forms/contact.yaml
```

Optionally install it with `pipx install check-jsonschema` outside the repository,
or use your existing draft-07 validator. Validation does not execute expressions,
check navigation targets or cycles, or test delivery. Preview the pushed form
and report any checks you could not perform.

## Contents

- [Top-level keys](#top-level-keys)
- [Localized text](#localized-text)
- [Start page](#start-page)
- [Sections](#sections)
- [Navigation (`next`)](#navigation-next)
- [Fields](#fields)
- [Field types](#field-types)
- [Options](#options)
- [Validators](#validators)
- [Expressions](#expressions)
- [Templating](#templating)
- [Completion screen](#completion-screen)
- [Connections](#connections)
- [Authentication](#authentication)
- [Prefilling fields from the URL](#prefilling-fields-from-the-url)
- [Theming and analytics](#theming-and-analytics)
- [Authoring checks and runtime behavior](#authoring-checks-and-runtime-behavior)

## Top-level keys

```yaml
version: 1
title: "Contact us"
description: "Send us a message."
start: {}        # optional, or `false` to skip the start page
locale: "en"
start_date: "2025-01-01"
end_date: "2025-12-31"
theme:
  primary: "#542EBC"
  logo: "https://example.com/logo.svg"
measurements:
  mixpanel: "your-project-token"
  posthog:
    token: "your-project-token"
    api_host: "https://eu.i.posthog.com"
sections: []       # required
completion: {}     # optional
connections: []    # optional
authentication:    # optional
  verifier: "publishable-hmac-verifier"
```

| Key | Type | Required | Description |
| --- | --- | --- | --- |
| `version` | number | Recommended | Schema version. Use `1`. |
| `title` | [localized text](#localized-text) | No | Form title, shown on the [start page](#start-page). |
| `description` | [localized text](#localized-text) | No | Short description under the title. |
| `start` | [Start](#start-page) or `false` | No | Overrides the start page, or `false` to skip it. |
| `sections` | array of [Section](#sections) | Yes | The body of the form. At least one. |
| `completion` | [Completion](#completion-screen) | No | The screen shown after submission. |
| `connections` | array of [Connection](#connections) | No | Webhooks or emails fired on submit. |
| `authentication` | [Authentication](#authentication) | No | Publishable verifier for an Access Key that can read completed submissions. |
| `start_date` | string (`YYYY-MM-DD`) | No | Before this date the form is closed. |
| `end_date` | string (`YYYY-MM-DD`) | No | After this date the form is closed. |
| `locale` | string | No | Default language code, for example `en`. |
| `theme` | object | No | `primary` accent color and an HTTPS `logo` URL. |
| `measurements` | object | No | Mixpanel and/or PostHog configuration for analytics. |

`id` is assigned by the server. Do not set it in your YAML.

## Localized text

Anywhere this reference says "localized text" you may write either a plain
string or a map of language code to string.

```yaml
# Plain string
title: "Contact us"

# Localized
title:
  en: "Contact us"
  es: "Contáctanos"
  de: "Kontaktiere uns"
```

The active language follows the form's `locale`, and can be overridden with a
`?lang=es` query parameter.

## Start page

Before the first section the respondent sees a start page: the form `title`, the
form `description`, and a button. It is on by default and needs no
configuration. It is omitted only when the form has neither a `title` nor a
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

| Key | Type | Description |
| --- | --- | --- |
| `title` | [localized text](#localized-text) | Heading. Defaults to the form `title`. |
| `description` | [localized text](#localized-text) | Body text. Defaults to the form `description`. |
| `button` | [localized text](#localized-text) | Call-to-action label. Defaults to a localized "Start". |

All three support [templating](#templating), so a
[URL prefill](#prefilling-fields-from-the-url) can address the respondent by
name. The form `title` remains the browser document title even when
`start.title` replaces the heading.

Set `start: false` to send the respondent straight into the first section:

```yaml
start: false
```

The respondent returns to the start page with the **Back** button on the first
section. A resumed form (`?step=`) opens on the saved section, not the start
page.

## Sections

A form is one or more sections. Each section is a page of fields, submitted as a
step. Multi-section forms support conditional routing.

A section's `title` and `description` are the heading shown at the top of that
page. The form `title` is not repeated above the fields, so a section with
neither renders no heading at all. Give every section a `title`.

```yaml
sections:
  - id: contact
    title: "Your details"
    description: "So we know how to reach you."
    fields:
      - id: full_name
        type: short_text
        label: "Full name"
    next: done
```

| Key | Type | Description |
| --- | --- | --- |
| `id` | string | Section identifier. Referenced by `next` rules. |
| `title` | [localized text](#localized-text) | Section heading, shown at the top of the page. |
| `description` | [localized text](#localized-text) | Text under the section heading. |
| `fields` | array of [Field](#fields) | The fields on this page. |
| `next` | string or array | Where to go after this section. See below. |

## Navigation (`next`)

`next` controls what happens when a section is completed. It is either a single
target or a list of conditional rules.

**Single target.** A section `id`, the literal `done` (finish the form and show
the completion screen), or an absolute `https://` URL (redirect the respondent).

```yaml
next: preferences        # go to the section with id "preferences"
next: done               # finish
next: "https://example.com/thanks"   # redirect
```

**Conditional rules.** A list evaluated top to bottom. The first `when` whose
[expression](#expressions) is truthy wins. An `else` entry is the fallback.

```yaml
next:
  - when: "data.respondent_type === 'Business'"
    go: organization
  - else: preferences
```

`go` and `else` accept the same targets as a single target (section id, `done`,
or a URL).

## Fields

Every field shares these keys, then adds type-specific keys. A `text_block`
uses the same contract and lifecycle even though some shared properties have no
effect.

```yaml
- id: email
  type: email
  label: "Email address"
  helper_text: "We will only use this to reply to you."
  placeholder: "jane@example.com"
  visible_when: "data.subscribe === 'Yes'"
  validators:
    - required
```

| Key | Type | Description |
| --- | --- | --- |
| `id` | string | Stable field identifier and the key the field value is stored under. |
| `type` | string | One of the [field types](#field-types) below. Required. |
| `label` | [localized text](#localized-text) | The field's label. |
| `helper_text` | [localized text](#localized-text) | Supporting text shown beneath the input. Not displayed on `hidden` or `text_block` fields. |
| `placeholder` | [localized text](#localized-text) | Placeholder text, where applicable. |
| `validators` | array of [Validator](#validators) | Validation rules. |
| `visible_when` | [expression](#expressions) | The field is shown only while this is truthy. |

## Field types

There are 24 field types.

### Content

Use `text_block` for summaries, instructions, disclosures, or terms placed
between questions. `content` is localized text, supports answer templating, and
renders safe Markdown. Headings, paragraphs, emphasis, lists, blockquotes,
inline and fenced code, and links are supported. Raw HTML and Markdown images
are not rendered; links are limited to HTTPS and `mailto:` URLs.

```yaml
- id: terms_summary
  type: text_block
  content: |
    ## Terms

    Please review our [privacy policy](https://example.com/privacy).
  visible_when: "data.account_type === 'Business'"
```

A text block follows the standard field path: its optional `label` renders above
the content and its value defaults to and persists as an empty string.
`placeholder` is accepted but unused, and `validators` are accepted but ignored.
Add a separate required choice field when the respondent must explicitly accept
terms.

### Turnstile verification

Use `turnstile` on any step to verify with Cloudflare in place:

```yaml
- id: human_check
  type: turnstile
  label: "Verification"
  validators: [required]
```

The field uses the standard label, localization, visibility, and validator
properties. Omit `required` to allow an empty answer. Successful verification
stores `"verified"` in `human_check` and a server-issued proof in the generated
hidden `human_check_token` field. Do not author the companion yourself; its ID
is reserved. Optional empty Turnstile fields do not require a companion proof.

Configure deployment-wide `TURNSTILE_SITE_KEY` on the web app,
`TURNSTILE_SECRET_KEY` on the API, and `VERIFICATION_SECRET` on the API.
Restrict the widget hostnames in Cloudflare. Keep secrets out of form YAML.
Missing configuration or failed verification cannot complete a required field.

Cloudflare responses are exchanged immediately for a local proof, so later
steps, saved-submission resume, and retries do not depend on Cloudflare's
five-minute response lifetime. Final submission checks the proof's form and
field scope. Like email OTP, local proofs have no expiry and can be reused
across submissions; rotating `VERIFICATION_SECRET` invalidates them.

### Text and numbers

| `type` | Renders as | Extra keys |
| --- | --- | --- |
| `short_text` | Single-line text input | none |
| `long_text` | Multi-line text area | none |
| `email` | Email input | `otp` (enable email verification) |
| `url` | URL input | none |
| `mobile_number` | Phone number input | none |
| `number` | Numeric input | none |
| `hidden` | Nothing (captures a value) | none |

`hidden` fields never appear to the respondent. They are useful for capturing a
value passed in the URL, for example a campaign source. See
[Prefilling fields from the URL](#prefilling-fields-from-the-url).

### Date and time

| `type` | Renders as |
| --- | --- |
| `date` | Full date picker |
| `date_month` | Month and year picker |
| `time` | Time-of-day picker |

### Choice

| `type` | Renders as | Extra keys |
| --- | --- | --- |
| `single_select` | One-of-many (radio style) | `options`, `allow_other` |
| `multiple_select` | Many-of-many (checkbox style) | `options`, `allow_other` |
| `dropdown` | Select menu | `options`, `searchable`, `depends_on`, `options_by_parent` |
| `rating` | 1 to 5 scale | `min_label`, `max_label` |

```yaml
- id: plan
  type: single_select
  label: "Choose a plan"
  allow_other: true          # adds a free-text "Other" option
  options:
    - "Free"
    - "Pro"

- id: org_size
  type: dropdown
  label: "Company size"
  searchable: true           # adds a search box to the menu
  options:
    - label: "1 to 10"
      value: "1-10"
    - label: "11 to 50"
      value: "11-50"

- id: experience
  type: rating
  label: "How experienced are you?"
  min_label: "Novice"
  max_label: "Expert"
```

Dropdowns can depend on an earlier dropdown. The child stays disabled until
its parent has a value, uses the matching option group, and clears when its
selection is no longer available:

```yaml
- id: province
  type: dropdown
  label: "Province"
  options:
    - label: "Gauteng"
      value: gauteng
    - label: "Western Cape"
      value: western_cape
  validators: [required]

- id: city
  type: dropdown
  label: "City"
  depends_on: province
  options_by_parent:
    gauteng: ["Johannesburg", "Pretoria"]
    western_cape: ["Cape Town"]
  validators: [required]
```

Each dropdown remains an ordinary answer, so this example stores
`data.province` and `data.city` as separate strings. Dependency keys match the
stored parent values, not their displayed labels. A dependent dropdown uses
`options_by_parent` instead of `options`, and its dependency should be an
earlier dropdown in the same section. Chain more fields in the same way for
province, city, and suburb selection.

### Media and files

| `type` | Renders as | Extra keys |
| --- | --- | --- |
| `file_upload` | File picker, uploads to object storage | `accepted_mime_types` |
| `camera` | Live camera capture | `facing_mode` (`front` or `rear`) |
| `signature` | Draw-to-sign pad | none |

```yaml
- id: resume
  type: file_upload
  label: "Upload a document"
  accepted_mime_types:
    - "application/pdf"
    - "image/png"
  validators:
    - type: max
      value: 2               # at most two files
      message: "Upload at most two files."
```

Uploaded media is stored in the deployment's S3-compatible object storage. Each
`file_upload`, `camera`, and `signature` answer contains an object with the file's `url`,
original or generated `name`, byte `size`, and MIME `type`. A `file_upload`
stores one object with no `max` or with `max: 1`, and an array of objects with a
larger `max`. Camera and signature fields store one object.

Templates can address individual properties, such as `{{data.resume.url}}`. For
a multiple-file answer, iterate over the array and address the same properties
on each item.

### Location

| `type` | Renders as | Extra keys |
| --- | --- | --- |
| `address` | Full-address autocomplete | `outputFormat` (`string` or `structured`) |
| `address_locality` | City autocomplete | `outputFormat` |
| `address_region` | State or region autocomplete | `outputFormat` |
| `address_country` | Country autocomplete | `outputFormat` |
| `geolocation` | Capture latitude and longitude, with a map | none |

```yaml
- id: hq_address
  type: address
  label: "Headquarters"
  outputFormat: structured   # store a structured object, not a string
```

Address fields use Google Places autocomplete when a Google Maps key is
configured (`GOOGLE_MAPS_API_KEY`). Without a key, they fall back to plain
text entry, so they always work. With `outputFormat: structured`, the answer is
an object (`formatted_address`, `locality`, `country`, `postal_code`, and more).
The default, `string`, stores the formatted address as a single string.

## Options

`single_select`, `multiple_select`, and `dropdown` take an `options` list. Each
option is either a string (used as both label and value) or an object with a
separate `label` and `value`.

```yaml
options:
  - "General enquiry"          # label and value are both this string
  - label: "1 to 10 people"    # shown to the respondent
    value: "1-10"              # stored in the answer
```

`allow_other: true` on a select field adds a free-text "Other" choice.

## Validators

`validators` is a list. Rules run in order, and the first failure is shown. Every
rule accepts an optional `message` to override the default text.

| Rule | Shape | Applies to | Meaning |
| --- | --- | --- | --- |
| Required | `required` or `{ type: required }` | any | The field must have a value. |
| Pattern | `{ type: pattern, regex }` | text | The value must match the regular expression. |
| Min length | `{ type: min_length, value }` | text | At least `value` characters. |
| Max length | `{ type: max_length, value }` | text | At most `value` characters. |
| Min | `{ type: min, value }` | number, date/time, rating, multiple select, files | See note below. |
| Max | `{ type: max, value }` | number, date/time, rating, multiple select, files | See note below. |
| Expression | `{ type: expression, expression }` | any | The [expression](#expressions) must be truthy. |

```yaml
validators:
  - required
  - type: min_length
    value: 20
    message: "Please write at least 20 characters."
```

**How `min` and `max` behave.** The rule adapts to the value:

- If the answer is a list (`multiple_select`, `file_upload`), the bound is a
  **count**. `min: 1` means at least one selection or file.
- If the bound is a number, it is a **numeric** comparison. `min: 18` on a
  `number` field means the value must be 18 or more.
- If the bound is a string, it is a **lexical** comparison, which is useful for
  dates written as strings.

Empty values pass every rule except `required` and count-based `min`/`max`, so an
optional field is only flagged once the respondent starts filling it in.

```yaml
# Number range
- id: age
  type: number
  validators:
    - type: min
      value: 18
    - type: max
      value: 120

# Selection count
- id: interests
  type: multiple_select
  validators:
    - type: min
      value: 1
      message: "Pick at least one."
    - type: max
      value: 3

# Cross-field check
- id: confirm_email
  type: email
  validators:
    - type: expression
      expression: "data.confirm_email === data.email"
      message: "Email addresses do not match."
```

## Expressions

Five keys accept an expression: `visible_when` on a field, `when` inside `next`
rules, `when` on completion rules and connections, and the `expression`
validator.

An expression is a JavaScript boolean expression evaluated against `data`, an
object holding every answer keyed by field `id`.

```yaml
visible_when: "data.newsletter === 'Yes'"
when: "data.age >= 18 && data.country === 'DE'"
expression: "data.confirm_email === data.email"
```

Keep expressions to plain comparisons and logic over `data`. They are meant for
conditions, not computation.

## Templating

`{{data.field_id}}` placeholders are filled in with the respondent's answers.
They are supported in:

- the form `title` and `description`
- the `start` `title`, `description`, and `button`
- a section `title` and `description`
- a field `label`, `helper_text`, and `placeholder`
- option labels, and a rating's `min_label` and `max_label`
- a text block's `content`
- the completion `title`, `message`, and the button's `label` and `url`
- an email connection's `to`, `subject`, and `body`

Templating is Handlebars with escaping turned off, and email bodies are sent as
HTML. An answer interpolated into completion text or an email body is not
escaped, so treat respondent input as untrusted when you template it.

Inside an email connection only, `{{form.title}}` also resolves.

```yaml
completion:
  title: "Thanks, {{data.full_name}}"
  message: "We will reply to {{data.email}}."
```

Use `calculate` to render a JavaScript expression inside any template-capable
property:

```yaml
- id: estimate
  type: text_block
  content: |
    ## Estimated value

    ${{calculate "(Number(data.floor_area) * Number(data.price_per_square_metre)).toLocaleString('en-US')"}}
```

The only supplied variable is `data`. Calculations use answers collected before
the current page and are re-evaluated when another page, the completion screen,
or an email is rendered. They do not update while the respondent types on the
current page, and their results are not stored in submissions or included in
webhook payloads. A calculation that throws or has invalid syntax renders as an
empty string.

## Completion screen

The screen shown after a form is finished. It is either a single object or a
list of rules.

**Single.**

```yaml
completion:
  title: "Thanks, {{data.full_name}}"
  message: "We received your message."
  button:
    label: "Back to site"
    url: "https://example.com"
```

**Conditional.** A list evaluated top to bottom. The first rule whose `when` is
truthy wins. A rule with no `when` is the default, so put it last.

```yaml
completion:
  - when: "data.respondent_type === 'Business'"
    title: "Thanks, {{data.org_name}}"
    message: "Our team will reach out."
  - title: "Thanks, {{data.full_name}}!"
    message: "We will reply to {{data.email}}."
    button:
      label: "Read the docs"
      url: "https://example.com/docs"
```

| Key | Type | Description |
| --- | --- | --- |
| `title` | [localized text](#localized-text) | Heading on the completion screen. |
| `message` | [localized text](#localized-text) | Body text. |
| `button` | object | Optional call to action: `label` and `url`. |
| `when` | [expression](#expressions) | Only on rules. Guards which screen shows. |

## Connections

Connections are queued in MongoDB and delivered by the scheduler. By default,
they run only for completed submissions. Use `trigger_on` to include partial
submissions, `delay_minutes` to delay delivery, and `when` to add an
[expression](#expressions) condition.

**Webhook.** POSTs the submission as JSON to a URL.

```yaml
connections:
  - type: webhook
    url: "https://example.com/hooks/new-lead"
    when: "data.newsletter === 'Yes'"
    trigger_on: completed
    delay_minutes: 30
```

**Email.** Sends an email through Resend. Requires `RESEND_API_KEY` and
`RESEND_FROM_EMAIL` on the server.

```yaml
connections:
  - type: email
    to: "team@example.com"
    subject: "New response from {{data.full_name}}"
    body: "A new response came in."
    include_responses: true    # append the answers to the email
    when: "data.topic === 'Support'"
    delay_minutes: 30
```

| Key | Applies to | Description |
| --- | --- | --- |
| `type` | both | `webhook` or `email`. |
| `url` | webhook | Destination for the POST. |
| `to` | email | Recipient address. |
| `subject` | email | Email subject. Supports templating. |
| `body` | email | Email body. Supports templating. |
| `include_responses` | email | Append all answers to the email. |
| `when` | both | Only fire when this expression is truthy. |
| `trigger_on` | both | `completed` (default), `partial`, or `any`. |
| `delay_minutes` | both | Minutes to wait before delivery. Defaults to `0`. |

### Submission triggers

`trigger_on` controls which saved submission states create delivery jobs:

| Value | Behavior |
| --- | --- |
| `completed` | Deliver once after final validation succeeds. This is the default. |
| `partial` | Deliver after every partial section save, but not on completion. |
| `any` | Deliver after every partial save and again on completion. |

Use `partial` and `any` deliberately: a multi-section form may create several
deliveries for one respondent. Retrying an already-completed submission does
not create another completion delivery.

`delay_minutes` must be a non-negative integer. Omit it or use `0` for delivery
on the scheduler's next polling cycle. The connection, form, and submission are
stored in the job's `data` payload, so later form edits do not change queued
work. Failed jobs are moved one minute forward and retried.

## Authentication

Authentication lets a form owner retrieve completed submissions without an
account. Generate an Access Key and its publishable verifier locally:

```bash
ACCESS_KEY="$(openssl rand -base64 32)"
VERIFIER="$(printf 'frms.dev authentication' | openssl dgst -sha256 -hmac "$ACCESS_KEY" -r | awk '{print $1}')"
printf 'Access Key (keep private): %s\nVerifier (safe to publish): %s\n' "$ACCESS_KEY" "$VERIFIER"
```

Store the Access Key like an API credential and put only its verifier in the
form:

```yaml
authentication:
  verifier: "replace-with-generated-verifier"
```

Use the Access Key in the authorization header, never in the URL:

```bash
curl \
  -H "Authorization: Bearer $ACCESS_KEY" \
  "https://api.example.com/api/v1/forms/a12345678/submissions?page=1&limit=100"
```

The endpoint returns a JSON array containing full completed submission records,
ordered by update time, oldest first. `page` defaults to `1`; `limit` defaults
to `100` and may not exceed `500`. Increment `page` until the endpoint returns
an empty array.

Anyone possessing the Access Key is authorized. Losing or rotating it requires
generating a replacement and updating the verifier. Removing `authentication`
revokes access without deleting submissions. Authorization uses the definition
belonging to the requested form ID, so a preview branch cannot grant access to
the canonical form's submissions.

## Prefilling fields from the URL

Any query parameter that is not reserved prefills the field whose `id` matches.
This is how `hidden` fields capture campaign data, and how you can pre-populate a
form from a link.

```
https://frms.dev/your-org/your-forms/signup?utm_source=newsletter&email=jane@example.com
```

The above fills a field with `id: utm_source` and a field with `id: email`.

Reserved parameters, which are never treated as prefill: `embed`, `lang`,
`submission_id`, `step`, `branch`.

## Theming and analytics

```yaml
theme:
  primary: "#542EBC"                         # accent color
  logo: "https://example.com/logo.svg"       # decorative brand logo

measurements:
  mixpanel: "your-token"   # optional shorthand
  posthog:
    token: "your-token"
    api_host: "https://eu.i.posthog.com"
```

`theme.primary` sets the accent color used across the form. `theme.logo` takes
an absolute HTTPS image URL and displays the decorative brand mark on the start,
question, status, and completion screens, including embeds. A logo that cannot
be loaded is hidden without blocking the form.

Configure either or both analytics providers under `measurements`. A provider
can be a project token string, or an object with these keys:

| Key | Required | Description |
| --- | --- | --- |
| `token` | Yes | The provider's public project token. |
| `api_host` | No | Ingestion host for another cloud region, reverse proxy, or self-hosted instance. |

The string shorthand keeps the existing Mixpanel EU host
(`https://api-eu.mixpanel.com`) and uses PostHog's US host
(`https://us.i.posthog.com`). Use the object form to choose a different host.

Mixpanel receives an explicit `page_view` once the form loads. PostHog uses its
native web analytics events: `$pageview` on the initial load and browser-history
changes, and `$pageleave` when the respondent navigates away. Both providers
receive `section_completed`. Automatic click, session-recording, survey, and
person-profile collection remains disabled.

| Event | Provider | Properties | When it is sent |
| --- | --- | --- | --- |
| `page_view` | Mixpanel | `form_id` | Once the form definition and its analytics configuration load. |
| `$pageview` | PostHog | Standard PostHog pageview properties | On the initial load and browser-history changes. |
| `$pageleave` | PostHog | Standard PostHog pageleave and scroll properties | When the respondent navigates away. |
| `section_completed` | Both | `form_id`, `section_id`, `is_final` | After a section passes validation and the respondent continues, completes, or redirects. |


## Authoring checks and runtime behavior

Before handing over a definition, validate parsed YAML against the JSON Schema
with available tooling, check the runtime behavior below, and preview the pushed form. Report
which checks actually ran. A local file is not live until it is pushed to a GitHub
repository the deployment can read.

### Identifiers and navigation

- Use unique field IDs across the whole form and unique section IDs. Prefer
  `snake_case` matching `^[A-Za-z_][A-Za-z0-9_]*$` so expressions can use `data.id`.
  Filenames may use hyphens.
- Do not author the top-level `id`; the server supplies it.
- Reserve the `_token` suffix for verification proofs. Email OTP and Turnstile
  reserve a companion `<field_id>_token` field.
- Check that every expression or template references an existing answer with the
  expected shape and that the answer is available at that point in the flow.
- Every `next` target must be `done`, an existing section ID, or an `https://` URL.
  Keep navigation acyclic and put a final `else` in conditional navigation.
  An unmatched rule otherwise finishes the form.
- Hiding a field excludes it from that section's submitted answers. An answer
  saved in an earlier section can remain in stored partial submissions; do not
  depend on a value whose field the same answer path hides.

### Check behavior, not just syntax

- Parsing loads YAML without validating its structure. Unsupported field and
  connection types can be dropped by resolution, and unsupported keys ignored.
  Confirm that every intended field appears in the rendered form.
- Broken conditions evaluate to `false`; broken calculations produce an empty
  string. Walk each branch and check computed text with representative answers.
- Match validators to the field type. Use `min_length`/`max_length` for text.
  `min`/`max` on selections and uploads count items; on ratings they set the scale.
- A `number` field expects whole numbers unless you supply a suitable `pattern`.
  An `email` field without OTP has no implicit format validation; add a pattern
  if format checking is required.
- Patterns are not automatically anchored. Escape backslashes when using
  double-quoted YAML strings. Empty values generally pass rules other than
  `required` and count bounds.
- Test the completion screen and delivery separately. A rendered form or accepted
  submission does not prove an email or webhook reached its destination.

### Public configuration and submitted data

- The definition is visible to people loading the form. Never put secrets or
  credentials in YAML, including webhook URLs. Use only delivery destinations
  provided by the form owner.
- An authentication verifier is safe to publish. Its matching Access Key is
  not and must never be added to YAML.
- Webhook requests have no configured custom headers or signatures. Handlebars
  escaping is disabled, and email bodies are HTML; treat interpolated respondent
  answers as untrusted content.
- `start_date`, `end_date`, and `accepted_mime_types` are browser checks; direct
  API calls bypass them. The server separately limits uploaded file size.
- File uploads hold one uploaded-file object when `max` is absent or `1`, and
  an array when `max` is larger. Camera and signature answers hold one file
  object. Choice answers are a string for `single_select` and an array for
  `multiple_select`.
- When editing a form that already has responses, preserve field IDs and option
  values unless intentionally changing the stored-data contract. Recheck both
  existing respondent paths and the changed path.
