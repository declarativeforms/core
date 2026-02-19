# Declarative Forms

Git-native forms and surveys

Declarative Forms is a developer-first alternative to traditional form platforms. Instead of building forms through visual editors, forms are defined as declarative configuration in a GitHub repository.

This approach lets forms evolve alongside your codebase, using the same workflows teams already rely on for collaboration, review, and change management. It's designed for developers who want a more predictable, maintainable way to create and manage forms—without being constrained by opaque UIs.

## Quick Start

Transform any GitHub repository into a form engine in under 60 seconds.

### 1. Add a config file

Create a file named `feedback.yaml` in the root of your repository:

```yaml
version: 1
title: "Quick Feedback"
description: ""
sections:
  - id: main
    fields:
      - id: feedback
        type: long_text
        label: "What can we improve?"
    next: done

connections:
  - type: webhook
    url: https://your-api.com/hooks/form
```

### 2. Push to GitHub

Commit and push the file to your repository.

### 3. Open your form

Your form is live immediately at:
`https://app.declarativeforms.com/<owner>/<repository>/feedback`

No build step, no deployment, no account required.

## Table of Contents

- [How It Works](#how-it-works)
- [Field Types](#field-types)
  - [short_text](#short_text) · [long_text](#long_text) · [email](#email) · [url](#url) · [number](#number) · [mobile_number](#mobile_number) · [date](#date)
  - [dropdown](#dropdown) · [single_select](#single_select) · [multiple_select](#multiple_select) · [rating](#rating)
  - [address](#address) · [file_upload](#file_upload) · [signature](#signature) · [hidden](#hidden)
- [Validators](#validators)
- [Form Logic](#form-logic)
- [Sections & Navigation](#sections--navigation)
- [Completion Page](#completion-page)
- [Connections](#connections)
- [Localization](#localization)
- [Form Settings](#form-settings)
- [URL Structure & Prefill](#url-structure--prefill)
- [Examples](#examples)
- [The 48-Hour Promise](#the-48-hour-promise)

## How It Works

Forms are YAML config files stored in a GitHub repository. Push a file, and it's instantly served as a live form at `https://app.declarativeforms.com/<owner>/<repo>/<file>`. Changes go through pull requests, history lives in git, and there's no separate platform to manage.

## Field Types

### Input Fields

---

#### short_text

Single-line text input for names, titles, and short answers.

```yaml
- id: name
  type: short_text
  label: What's your name?
  placeholder: John
  validators:
    - required
```

[Source](https://github.com/declarativeforms/examples/blob/main/short_text.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/short_text)

<details>
<summary>All properties</summary>

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique field identifier |
| `type` | `"short_text"` | Yes | Field type |
| `label` | string \| locale map | Yes | Field label |
| `placeholder` | string \| locale map | No | Placeholder text |
| `validators` | array | No | Validation rules |
| `visible_when` | string | No | JS expression for conditional visibility |

- `min`/`max` validators control **character length**.

```yaml
- id: username
  type: short_text
  label: Username
  placeholder: Enter a username
  validators:
    - required
    - type: min
      value: 3
    - type: max
      value: 20
    - type: pattern
      regex: "^[a-zA-Z0-9_]+$"
      message: Only letters, numbers, and underscores are allowed
```

</details>

---

#### long_text

Multi-line textarea for comments, feedback, and longer responses.

```yaml
- id: feedback
  type: long_text
  label: Any additional comments?
  placeholder: Tell us more...
```

[Source](https://github.com/declarativeforms/examples/blob/main/long_text.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/long_text)

<details>
<summary>All properties</summary>

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique field identifier |
| `type` | `"long_text"` | Yes | Field type |
| `label` | string \| locale map | Yes | Field label |
| `placeholder` | string \| locale map | No | Placeholder text |
| `validators` | array | No | Validation rules |
| `visible_when` | string | No | JS expression for conditional visibility |

- `min`/`max` validators control **character length**.

```yaml
- id: feedback
  type: long_text
  label:
    en: "Additional comments"
    es: "Comentarios adicionales"
  placeholder:
    en: "Tell us more..."
    es: "Cuéntanos más..."
  validators:
    - type: max
      value: 500
      message:
        en: "Please keep your response under 500 characters."
        es: "Mantén tu respuesta en menos de 500 caracteres."
```

</details>

---

#### email

Email input with built-in format validation. Supports optional OTP (one-time password) verification.

```yaml
- id: email
  type: email
  label: What's your email?
  placeholder: hello@example.com
  validators:
    - required
```

[Source](https://github.com/declarativeforms/examples/blob/main/email.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/email)

<details>
<summary>All properties</summary>

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique field identifier |
| `type` | `"email"` | Yes | Field type |
| `label` | string \| locale map | Yes | Field label |
| `placeholder` | string \| locale map | No | Placeholder text |
| `otp` | boolean | No | Enable OTP email verification |
| `validators` | array | No | Validation rules |
| `visible_when` | string | No | JS expression for conditional visibility |

- `min`/`max` validators control **character length**.
- When `otp: true`, the user must enter a verification code sent to their email before the form can be submitted.

```yaml
- id: email
  type: email
  label: What's your email?
  placeholder: hello@declarativeforms.com
  otp: true
  validators:
    - required
```

[OTP Source](https://github.com/declarativeforms/examples/blob/main/email_otp.yaml) · [OTP Demo](https://app.declarativeforms.com/declarativeforms/examples/email_otp)

</details>

---

#### url

URL input with format validation.

```yaml
- id: website
  type: url
  label: Your website
  placeholder: https://example.com
```

[Source](https://github.com/declarativeforms/examples/blob/main/url.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/url)

<details>
<summary>All properties</summary>

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique field identifier |
| `type` | `"url"` | Yes | Field type |
| `label` | string \| locale map | Yes | Field label |
| `placeholder` | string \| locale map | No | Placeholder text |
| `validators` | array | No | Validation rules |
| `visible_when` | string | No | JS expression for conditional visibility |

- `min`/`max` validators control **character length**.

</details>

---

#### number

Numeric input. Defaults to whole-number validation (`^\d+$`) unless a custom `pattern` validator is provided.

```yaml
- id: age
  type: number
  label: Age
  placeholder: Enter your age
  validators:
    - required
    - type: min
      value: 18
    - type: max
      value: 120
```

[Source](https://github.com/declarativeforms/examples/blob/main/number.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/number)

<details>
<summary>All properties</summary>

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique field identifier |
| `type` | `"number"` | Yes | Field type |
| `label` | string \| locale map | Yes | Field label |
| `placeholder` | string \| locale map | No | Placeholder text |
| `validators` | array | No | Validation rules |
| `visible_when` | string | No | JS expression for conditional visibility |

- `min`/`max` validators control **numeric value** (not character length).
- A default pattern of `^\d+$` is applied unless you provide your own `pattern` validator.

</details>

---

#### mobile_number

Phone number input with international format support.

```yaml
- id: phone
  type: mobile_number
  label: Mobile number
  placeholder: "+1 555 000 0000"
  validators:
    - required
```

[Source](https://github.com/declarativeforms/examples/blob/main/mobile_number.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/mobile_number)

<details>
<summary>All properties</summary>

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique field identifier |
| `type` | `"mobile_number"` | Yes | Field type |
| `label` | string \| locale map | Yes | Field label |
| `placeholder` | string \| locale map | No | Placeholder text |
| `validators` | array | No | Validation rules |
| `visible_when` | string | No | JS expression for conditional visibility |

</details>

---

#### date

Date picker input. Min/max validators accept `YYYY-MM-DD` date strings.

```yaml
- id: dob
  type: date
  label: Date of birth
  validators:
    - required
    - type: max
      value: "2010-01-01"
      message: You must be at least 16 years old
```

[Source](https://github.com/declarativeforms/examples/blob/main/date.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/date)

<details>
<summary>All properties</summary>

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique field identifier |
| `type` | `"date"` | Yes | Field type |
| `label` | string \| locale map | Yes | Field label |
| `placeholder` | string \| locale map | No | Placeholder text |
| `validators` | array | No | Validation rules |
| `visible_when` | string | No | JS expression for conditional visibility |

- `min`/`max` validators control **date bounds** using `YYYY-MM-DD` strings.
  - `min` = earliest allowed date
  - `max` = latest allowed date

</details>

### Selection Fields

---

#### dropdown

Dropdown select menu. Supports an optional `searchable` mode for long option lists.

```yaml
- id: role
  type: dropdown
  label: What's your role?
  placeholder: Select an option
  options:
    - Founder
    - Software Engineer
    - Product Manager
    - Other
  validators:
    - required
```

[Source](https://github.com/declarativeforms/examples/blob/main/dropdown.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/dropdown)

<details>
<summary>All properties</summary>

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique field identifier |
| `type` | `"dropdown"` | Yes | Field type |
| `label` | string \| locale map | Yes | Field label |
| `placeholder` | string \| locale map | No | Placeholder text |
| `options` | array | Yes | List of options (strings or `{label, value}` objects) |
| `searchable` | boolean | No | Enable type-to-filter search |
| `validators` | array | No | Validation rules |
| `visible_when` | string | No | JS expression for conditional visibility |

```yaml
- id: country
  type: dropdown
  label: Which country are you from?
  placeholder: Select a country
  searchable: true
  options:
    - Argentina
    - Australia
    - Brazil
    - Canada
    - United States
  validators:
    - required
```

[Searchable Source](https://github.com/declarativeforms/examples/blob/main/dropdown_searchable.yaml) · [Searchable Demo](https://app.declarativeforms.com/declarativeforms/examples/dropdown_searchable)

</details>

---

#### single_select

Radio-button style selection. Displays all options inline for quick selection.

```yaml
- id: consent
  type: single_select
  label: Do you agree to the terms?
  options:
    - "Yes"
    - "No"
  validators:
    - required
```

[Source](https://github.com/declarativeforms/examples/blob/main/single_select.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/single_select)

<details>
<summary>All properties</summary>

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique field identifier |
| `type` | `"single_select"` | Yes | Field type |
| `label` | string \| locale map | Yes | Field label |
| `placeholder` | string \| locale map | No | Placeholder text |
| `options` | array | Yes | List of options (strings or `{label, value}` objects) |
| `validators` | array | No | Validation rules |
| `visible_when` | string | No | JS expression for conditional visibility |

Options can be simple strings or `{label, value}` objects. Use the object syntax to decouple the display label from the stored value:

```yaml
- id: country
  type: single_select
  label: Country
  options:
    - value: us
      label: "United States"
    - value: gb
      label: "United Kingdom"
```

[Label/Value Source](https://github.com/declarativeforms/examples/blob/main/options_label_value.yaml) · [Label/Value Demo](https://app.declarativeforms.com/declarativeforms/examples/options_label_value)

</details>

---

#### multiple_select

Checkbox-style selection allowing multiple choices.

```yaml
- id: interests
  type: multiple_select
  label: How did you hear about us?
  options:
    - GitHub
    - Google
    - Product Hunt
  validators:
    - required
```

[Source](https://github.com/declarativeforms/examples/blob/main/multiple_select.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/multiple_select)

<details>
<summary>All properties</summary>

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique field identifier |
| `type` | `"multiple_select"` | Yes | Field type |
| `label` | string \| locale map | Yes | Field label |
| `placeholder` | string \| locale map | No | Placeholder text |
| `options` | array | Yes | List of options (strings or `{label, value}` objects) |
| `validators` | array | No | Validation rules |
| `visible_when` | string | No | JS expression for conditional visibility |

- `min`/`max` validators control **selection count** (not character length).

```yaml
- id: topics
  type: multiple_select
  label: Select your interests
  options:
    - Frontend
    - Backend
    - DevOps
    - Design
    - Data Science
  validators:
    - required
    - type: min
      value: 2
      message: Please select at least 2 topics
    - type: max
      value: 3
      message: Please select at most 3 topics
```

</details>

---

#### rating

Star/numeric rating scale with configurable range. Defaults to 1-5.

```yaml
- id: nps
  type: rating
  label: How likely are you to recommend us?
  min_label: Not likely
  max_label: Very likely
  validators:
    - required
```

[Source](https://github.com/declarativeforms/examples/blob/main/rating.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/rating)

<details>
<summary>All properties</summary>

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique field identifier |
| `type` | `"rating"` | Yes | Field type |
| `label` | string \| locale map | Yes | Field label |
| `min_label` | string \| locale map | No | Label displayed below the minimum value |
| `max_label` | string \| locale map | No | Label displayed below the maximum value |
| `validators` | array | No | Validation rules |
| `visible_when` | string | No | JS expression for conditional visibility |

- `min`/`max` validators configure the **rating scale range** (defaults to 1-5).
- The number of stars/options rendered is determined by the range.

```yaml
- id: nps
  type: rating
  label: How likely are you to recommend us?
  min_label: Not likely
  max_label: Very likely
  validators:
    - required
    - type: min
      value: 1
    - type: max
      value: 10
```

</details>

### Complex Fields

---

#### address

Google Places-powered address autocomplete. Supports four sub-types for scoped lookups: `address` (full address), `address_locality` (city), `address_region` (state/province), and `address_country` (country).

```yaml
- id: home_address
  type: address
  label: Home address
  placeholder: Start typing your address
  validators:
    - required
```

[Source](https://github.com/declarativeforms/examples/blob/main/address.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/address)

<details>
<summary>All properties</summary>

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique field identifier |
| `type` | `"address"` \| `"address_locality"` \| `"address_region"` \| `"address_country"` | Yes | Address scope |
| `label` | string \| locale map | Yes | Field label |
| `placeholder` | string \| locale map | No | Placeholder text |
| `outputFormat` | `"string"` \| `"structured"` | No | Output format (default: `"string"`) |
| `validators` | array | No | Validation rules |
| `visible_when` | string | No | JS expression for conditional visibility |

By default, the address is stored as a plain formatted string. Set `outputFormat: "structured"` to receive individual address components:

```yaml
- id: home_address
  type: address
  label: Home address
  placeholder: Start typing your address
  outputFormat: structured
  validators:
    - required
```

The structured output includes: `formatted_address`, `street_number`, `route`, `locality`, `administrative_area_level_1`, `country`, `postal_code`, and `place_id`.

[Structured Source](https://github.com/declarativeforms/examples/blob/main/address_structured.yaml) · [Structured Demo](https://app.declarativeforms.com/declarativeforms/examples/address_structured)

</details>

---

#### file_upload

File upload with drag-and-drop support. Supports single and multiple file uploads.

```yaml
- id: documents
  type: file_upload
  label: Upload your documents
  placeholder: Accepts all types of files
  validators:
    - required
```

[Source](https://github.com/declarativeforms/examples/blob/main/file_upload.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/file_upload)

<details>
<summary>All properties</summary>

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique field identifier |
| `type` | `"file_upload"` | Yes | Field type |
| `label` | string \| locale map | Yes | Field label |
| `placeholder` | string \| locale map | No | Placeholder / helper text |
| `validators` | array | No | Validation rules |
| `visible_when` | string | No | JS expression for conditional visibility |

- `min`/`max` validators control **file count**.
- A single file is stored as a URL string. Multiple files are stored as an array of URL strings.

```yaml
- id: documents
  type: file_upload
  label: Upload your documents
  validators:
    - required
    - type: min
      value: 1
    - type: max
      value: 5
      message: You can upload at most 5 files
```

</details>

---

#### signature

Canvas-based signature drawing pad. The signature is uploaded and stored as a URL.

```yaml
- id: sig
  type: signature
  label: Signature
  validators:
    - required
```

[Source](https://github.com/declarativeforms/examples/blob/main/signature.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/signature)

<details>
<summary>All properties</summary>

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique field identifier |
| `type` | `"signature"` | Yes | Field type |
| `label` | string \| locale map | Yes | Field label |
| `validators` | array | No | Validation rules |
| `visible_when` | string | No | JS expression for conditional visibility |

The signature is drawn on a canvas, debounced, then uploaded. The stored value is the URL of the uploaded image.

</details>

---

#### hidden

Invisible field with no rendered UI. Useful for passing data through URL prefill parameters without displaying it to the user.

```yaml
- id: campaign_id
  type: hidden
  label: Campaign ID
```

[Source](https://github.com/declarativeforms/examples/blob/main/hidden.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/hidden)

<details>
<summary>All properties</summary>

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique field identifier |
| `type` | `"hidden"` | Yes | Field type |
| `label` | string \| locale map | Yes | Field label (not displayed) |

Hidden fields are typically populated via [URL prefill](#url-structure--prefill):

```
https://app.declarativeforms.com/owner/repo/form?campaign_id=summer2025
```

</details>

## Validators

Four validator types are available: `required`, `min`, `max`, and `pattern`.

```yaml
validators:
  - required
  - type: min
    value: 3
    message: "Must be at least 3"    # optional
  - type: max
    value: 100
    message: "Must be at most 100"   # optional
  - type: pattern
    regex: "^[a-zA-Z]+$"
    message: "Letters only"          # optional
```

### Behavior by field type

The meaning of `min` and `max` changes depending on the field type:

| Field Type | `min` / `max` meaning |
|---|---|
| `short_text`, `long_text`, `email`, `url` | Character length |
| `number` | Numeric value |
| `date` | Date bounds (`YYYY-MM-DD` strings) |
| `rating` | Scale range (default 1-5) |
| `multiple_select` | Selection count |
| `file_upload` | File count |

The `message` property is optional on `min`, `max`, and `pattern` validators. When omitted, a sensible default message is generated. Messages support [localization](#localization).

[Source](https://github.com/declarativeforms/examples/blob/main/validators.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/validators)

## Form Logic

### Conditional Visibility (`visible_when`)

Fields can be shown or hidden based on other field values. The `visible_when` property accepts a JavaScript expression evaluated with a `data` context object containing all current field values.

```yaml
fields:
  - id: is_citizen
    type: single_select
    label: Are you a citizen?
    options:
      - "Yes"
      - "No"
    validators:
      - required
  - id: id_number
    type: short_text
    label: ID Number
    visible_when: data.is_citizen === 'Yes'
    validators:
      - required
  - id: passport
    type: short_text
    label: Passport Number
    visible_when: data.is_citizen === 'No'
    validators:
      - required
```

When a field is hidden, its validators are not enforced.

[Source](https://github.com/declarativeforms/examples/blob/main/visible_when.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/visible_when)

### Conditional Navigation (`next`)

Section navigation can be static or conditional.

**Static** — always go to the same destination:

```yaml
next: section_2     # Go to another section
next: done          # End the form
next: "https://example.com"   # Redirect to external URL
```

**Conditional** — branch based on field values:

```yaml
next:
  - when: data.answer == "Yes"
    go: section_2
  - else: done
```

The `when` property is a JavaScript expression evaluated with the same `data` context as `visible_when`. Rules are evaluated in order; the first match wins. The `else` clause acts as a fallback.

[Source](https://github.com/declarativeforms/examples/blob/main/conditional_navigation.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/conditional_navigation)

## Sections & Navigation

Forms are composed of one or more sections. Each section has its own set of fields and a `next` directive controlling where the user goes after completing it.

```yaml
sections:
  - id: section_1
    title: "Personal Info"
    fields:
      - id: name
        type: short_text
        label: Name
        validators:
          - required
    next: section_2

  - id: section_2
    title: "Feedback"
    fields:
      - id: comments
        type: long_text
        label: Comments
    next: done
```

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique section identifier |
| `title` | string \| locale map | Yes | Section heading displayed to the user |
| `fields` | array | Yes | Fields in this section |
| `next` | string \| array | Yes | Navigation target: section `id`, `"done"`, external URL, or conditional array |

Submissions are saved partially after each section. If a user leaves and returns, they can resume using `?submission_id=X&step=Y` in the URL.

## Completion Page

Customize the page shown after the final submission with the top-level `completion` property.

```yaml
completion:
  title: Thank you, {{data.question_1}}!
  message: We've received your application and will be in touch within 48 hours.
  button:
    label: Visit our website
    url: https://example.com
```

| Property | Type | Required | Description |
|---|---|---|---|
| `title` | string \| locale map | No | Heading text |
| `message` | string \| locale map | No | Body text |
| `button.label` | string \| locale map | No | Button text |
| `button.url` | string \| locale map | No | Button link URL |

Use `{{data.fieldId}}` to interpolate submission values into `title`, `message`, or `button.url`. All properties support [localization](#localization).

[Source](https://github.com/declarativeforms/examples/blob/main/completion.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/completion)

## Connections

Connections fire on final form submission. Define them in the top-level `connections` array.

### Webhook

Sends a POST request with the full submission payload to the specified URL.

```yaml
connections:
  - type: webhook
    url: https://your-api.com/hooks/form
```

| Property | Type | Required | Description |
|---|---|---|---|
| `type` | `"webhook"` | Yes | Connection type |
| `url` | string | Yes | Endpoint URL |

[Source](https://github.com/declarativeforms/examples/blob/main/connections_webhook.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/connections_webhook)

### Email

Sends an email on submission. Supports template interpolation with `{{data.fieldId}}` and `{{form.title}}`.

```yaml
connections:
  # Admin notification
  - type: email
    to: admin@example.com
    subject: "New submission - {{form.title}}"
    include_responses: true

  # Respondent confirmation
  - type: email
    to: "{{data.email}}"
    subject: Thanks for your submission
    body: |
      Hi {{data.name}}, we received your response.
```

| Property | Type | Required | Description |
|---|---|---|---|
| `type` | `"email"` | Yes | Connection type |
| `to` | string | Yes | Recipient email (supports `{{data.fieldId}}`) |
| `subject` | string \| locale map | Yes | Email subject line |
| `body` | string \| locale map | No | Email body (supports template interpolation) |
| `include_responses` | boolean | No | Embed all field responses in the email body |

[Source](https://github.com/declarativeforms/examples/blob/main/connections_email.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/connections_email)

### Airtable

Pushes submission data to an Airtable base. Requires a connection ID configured in the platform.

```yaml
connections:
  - type: airtable
    connection_id: your_connection_id
    base_id: appXXXXXXXXXX
    table_id_or_name: Submissions
```

| Property | Type | Required | Description |
|---|---|---|---|
| `type` | `"airtable"` | Yes | Connection type |
| `connection_id` | string | Yes | Platform connection identifier |
| `base_id` | string | Yes | Airtable base ID |
| `table_id_or_name` | string | Yes | Airtable table ID or name |

[Source](https://github.com/declarativeforms/examples/blob/main/connections_airtable.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/connections_airtable)

## Localization

### Locale Detection

The active locale is resolved in this order:

1. `?lang=` query parameter (e.g. `?lang=es`)
2. Browser locale (e.g. `en-US` falls back to `en`)
3. Form-level `locale` setting (locks the form to a specific locale)
4. Default: `en`

### Content Localization

Any string property (`title`, `label`, `placeholder`, `message`, etc.) can be either a plain string or a locale map:

```yaml
title:
  en: "Customer Feedback"
  es: "Opinión del cliente"
```

Locale map fallback order:
1. Active locale
2. `en`
3. First available translation

### Localized Options

Use `{label, value}` option objects to keep submission values stable across languages:

```yaml
- id: satisfaction
  type: single_select
  label:
    en: "How satisfied are you?"
    es: "¿Qué tan satisfecho estás?"
  options:
    - value: very_satisfied
      label:
        en: "Very satisfied"
        es: "Muy satisfecho"
    - value: satisfied
      label:
        en: "Satisfied"
        es: "Satisfecho"
    - value: neutral
      label:
        en: "Neutral"
        es: "Neutral"
```

The `value` is what gets stored in submissions (stable across languages). The `label` is what the user sees (translated).

[Source](https://github.com/declarativeforms/examples/blob/main/localization.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/localization)

## Form Settings

Top-level configuration properties for the form:

| Property | Type | Required | Description |
|---|---|---|---|
| `version` | number | Yes | Config version (currently `1`) |
| `title` | string \| locale map | Yes | Form title |
| `description` | string \| locale map | No | Form description |
| `locale` | string | No | Lock form to a specific locale |
| `start_date` | string | No | Form opens on this date (`YYYY-MM-DD`) |
| `end_date` | string | No | Form closes after this date (`YYYY-MM-DD`) |
| `mixpanel` | string | No | Mixpanel project token for analytics |
| `sections` | array | Yes | Form sections |
| `connections` | array | Yes | Submission handlers |
| `completion` | object | No | Custom completion page |

[Start Date Source](https://github.com/declarativeforms/examples/blob/main/start_date.yaml) · [End Date Source](https://github.com/declarativeforms/examples/blob/main/end_date.yaml) · [Mixpanel Source](https://github.com/declarativeforms/examples/blob/main/mixpanel.yaml)

## URL Structure & Prefill

### URL Pattern

```
https://app.declarativeforms.com/<owner>/<repo>/<file>
```

The `<file>` segment maps to `<file>.yaml` in the repository root.

### Prefill via Query Parameters

Any query parameter that matches a field `id` will prefill that field's value:

```
https://app.declarativeforms.com/owner/repo/form?name=Jane&email=jane@example.com
```

This works with all field types, including [hidden](#hidden) fields for passing through tracking data.

[Source](https://github.com/declarativeforms/examples/blob/main/prefill.yaml) · [Demo](https://app.declarativeforms.com/declarativeforms/examples/prefill?name=Jane&email=jane@example.com)

### Reserved Parameters

| Parameter | Description |
|---|---|
| `connection_id` | Airtable connection identifier |
| `lang` | Override active locale |
| `submission_id` | Resume a partial submission |
| `step` | Resume at a specific section |

## Examples

### Getting Started

| Example | Source | Demo |
|---|---|---|
| Basic | [Source](https://github.com/declarativeforms/examples/blob/main/basic.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/basic) |
| Advanced | [Source](https://github.com/declarativeforms/examples/blob/main/advanced.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/advanced) |

### Input Fields

| Example | Source | Demo |
|---|---|---|
| Short Text | [Source](https://github.com/declarativeforms/examples/blob/main/short_text.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/short_text) |
| Long Text | [Source](https://github.com/declarativeforms/examples/blob/main/long_text.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/long_text) |
| Number | [Source](https://github.com/declarativeforms/examples/blob/main/number.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/number) |
| Email | [Source](https://github.com/declarativeforms/examples/blob/main/email.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/email) |
| Email with OTP | [Source](https://github.com/declarativeforms/examples/blob/main/email_otp.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/email_otp) |
| URL | [Source](https://github.com/declarativeforms/examples/blob/main/url.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/url) |
| Mobile Number | [Source](https://github.com/declarativeforms/examples/blob/main/mobile_number.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/mobile_number) |
| Date | [Source](https://github.com/declarativeforms/examples/blob/main/date.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/date) |

### Selection Fields

| Example | Source | Demo |
|---|---|---|
| Dropdown | [Source](https://github.com/declarativeforms/examples/blob/main/dropdown.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/dropdown) |
| Searchable Dropdown | [Source](https://github.com/declarativeforms/examples/blob/main/dropdown_searchable.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/dropdown_searchable) |
| Single Select | [Source](https://github.com/declarativeforms/examples/blob/main/single_select.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/single_select) |
| Multiple Select | [Source](https://github.com/declarativeforms/examples/blob/main/multiple_select.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/multiple_select) |
| Rating | [Source](https://github.com/declarativeforms/examples/blob/main/rating.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/rating) |
| Options with Label/Value | [Source](https://github.com/declarativeforms/examples/blob/main/options_label_value.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/options_label_value) |

### Complex Fields

| Example | Source | Demo |
|---|---|---|
| Address | [Source](https://github.com/declarativeforms/examples/blob/main/address.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/address) |
| Address (Structured) | [Source](https://github.com/declarativeforms/examples/blob/main/address_structured.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/address_structured) |
| File Upload | [Source](https://github.com/declarativeforms/examples/blob/main/file_upload.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/file_upload) |
| Signature | [Source](https://github.com/declarativeforms/examples/blob/main/signature.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/signature) |
| Hidden | [Source](https://github.com/declarativeforms/examples/blob/main/hidden.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/hidden) |

### Form Logic

| Example | Source | Demo |
|---|---|---|
| Validators | [Source](https://github.com/declarativeforms/examples/blob/main/validators.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/validators) |
| Conditional Visibility | [Source](https://github.com/declarativeforms/examples/blob/main/visible_when.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/visible_when) |
| Conditional Navigation | [Source](https://github.com/declarativeforms/examples/blob/main/conditional_navigation.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/conditional_navigation) |
| Prefill via URL | [Source](https://github.com/declarativeforms/examples/blob/main/prefill.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/prefill?name=Jane&email=jane@example.com) |

### Connections

| Example | Source | Demo |
|---|---|---|
| Webhook | [Source](https://github.com/declarativeforms/examples/blob/main/connections_webhook.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/connections_webhook) |
| Email | [Source](https://github.com/declarativeforms/examples/blob/main/connections_email.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/connections_email) |
| Airtable | [Source](https://github.com/declarativeforms/examples/blob/main/connections_airtable.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/connections_airtable) |

### Settings

| Example | Source | Demo |
|---|---|---|
| Custom Completion | [Source](https://github.com/declarativeforms/examples/blob/main/completion.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/completion) |
| Start Date | [Source](https://github.com/declarativeforms/examples/blob/main/start_date.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/start_date) |
| End Date | [Source](https://github.com/declarativeforms/examples/blob/main/end_date.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/end_date) |
| Localization | [Source](https://github.com/declarativeforms/examples/blob/main/localization.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/localization) |
| Mixpanel | [Source](https://github.com/declarativeforms/examples/blob/main/mixpanel.yaml) | [Demo](https://app.declarativeforms.com/declarativeforms/examples/mixpanel) |

## The 48-Hour Promise

Most form platforms have feature request boards where ideas go to die. Hundreds of requests, some over 18 months old, sitting in a backlog that never moves.

We do things differently. Open a [GitHub Issue](https://github.com/declarativeforms/examples/issues) with your feature request — if it genuinely improves the product, we'll ship it within 48 hours.

No waitlists. No roadmap purgatory. No "we'll consider it." Just open an issue and watch it get built.
