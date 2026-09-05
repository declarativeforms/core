# Form schema reference

Every form is a single YAML file. This document is the complete reference for
that file: every top-level key, every field type, every validator, and the small
expression language used for logic and templating.

If you are just getting started, read the [README](./README.md) first. Two
ready-to-copy examples ship in this repo:
[`contact.yaml`](./contact.yaml) (minimal) and
[`kitchen-sink.yaml`](./kitchen-sink.yaml) (every feature).

Everything below is also published as a machine-readable JSON Schema at
**<https://frms.dev/schema.json>**, generated from the engine itself. Add
this modeline to the top of your form and your editor will validate it as you
type:

```yaml
# yaml-language-server: $schema=https://frms.dev/schema.json
```

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
- [Prefilling fields from the URL](#prefilling-fields-from-the-url)
- [Theming and analytics](#theming-and-analytics)

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
measurements:
  mixpanel: "your-project-token"
  posthog:
    token: "your-project-token"
    api_host: "https://eu.i.posthog.com"
sections: []       # required
completion: {}     # optional
connections: []    # optional
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
| `start_date` | string (`YYYY-MM-DD`) | No | Before this date the form is closed. |
| `end_date` | string (`YYYY-MM-DD`) | No | After this date the form is closed. |
| `locale` | string | No | Default language code, for example `en`. |
| `theme` | object | No | `primary` accent color as a hex string. |
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

Every field shares these keys, then adds type-specific keys.

```yaml
- id: email
  type: email
  label: "Email address"
  placeholder: "jane@example.com"
  visible_when: "data.subscribe === 'Yes'"
  validators:
    - required
```

| Key | Type | Description |
| --- | --- | --- |
| `id` | string | Key the answer is stored under. Used in expressions and templates. |
| `type` | string | One of the [field types](#field-types) below. Required. |
| `label` | [localized text](#localized-text) | The field's label. |
| `placeholder` | [localized text](#localized-text) | Placeholder text, where applicable. |
| `validators` | array of [Validator](#validators) | Validation rules. |
| `visible_when` | [expression](#expressions) | The field is shown only while this is truthy. |

## Field types

There are 22 field types.

### Text and numbers

| `type` | Renders as | Extra keys |
| --- | --- | --- |
| `short_text` | Single-line text input | none |
| `long_text` | Multi-line text area | none |
| `email` | Email input | none |
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
| `dropdown` | Select menu | `options`, `searchable` |
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

Uploaded files are stored in your S3-compatible bucket, and the answer holds
their URLs.

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

Four keys accept an expression: `visible_when` on a field, `when` inside `next`
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
- a field `label` and `placeholder`
- option labels, and a rating's `min_label` and `max_label`
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
  primary: "#542EBC"       # accent color, any hex string

measurements:
  mixpanel: "your-token"   # optional shorthand
  posthog:
    token: "your-token"
    api_host: "https://eu.i.posthog.com"
```

`theme.primary` sets the accent color used across the form. Configure either or
both analytics providers under `measurements`. A provider can be a project token
string, or an object with these keys:

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
