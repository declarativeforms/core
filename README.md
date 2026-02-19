# Declarative Forms

Git-native forms and surveys

Declarative Forms is a developer-first alternative to traditional form platforms. Instead of building forms through visual editors, forms are defined as declarative configuration in a GitHub repository.

This approach lets forms evolve alongside your codebase, using the same workflows teams already rely on for collaboration, review, and change management. It’s designed for developers who want a more predictable, maintainable way to create and manage forms—without being constrained by opaque UIs.

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

## The problem with form builders

Form platforms work well when forms are simple. But as soon as forms become part of real workflows—changing over time, reused across contexts, or shared across teams—they start to feel limiting.

Most tools force you to manage forms through visual interfaces that hide structure and logic behind layers of UI. This makes it hard to see what’s actually going on, hard to track changes over time, and hard to treat forms as something that can be maintained with the same discipline as the rest of a system.

At some point, you either live with the constraints, or you start wishing forms could be defined the same way you define everything else: explicitly, in one place, and under version control.

## Examples

### Getting Started

- [Basic](https://github.com/declarativeforms/examples/blob/main/basic.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/basic))
- [Advanced](https://github.com/declarativeforms/examples/blob/main/advanced.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/advanced))

### Field Types

#### Input

- [Short Text](https://github.com/declarativeforms/examples/blob/main/short_text.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/short_text))
- [Long Text](https://github.com/declarativeforms/examples/blob/main/long_text.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/long_text))
- [Number](https://github.com/declarativeforms/examples/blob/main/number.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/number))
- [Email](https://github.com/declarativeforms/examples/blob/main/email.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/email))
- [Email with OTP](https://github.com/declarativeforms/examples/blob/main/email_otp.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/email_otp))
- [URL](https://github.com/declarativeforms/examples/blob/main/url.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/url))
- [Mobile Number](https://github.com/declarativeforms/examples/blob/main/mobile_number.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/mobile_number))
- [Date](https://github.com/declarativeforms/examples/blob/main/date.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/date))

#### Selection

- [Dropdown](https://github.com/declarativeforms/examples/blob/main/dropdown.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/dropdown))
- [Searchable Dropdown](https://github.com/declarativeforms/examples/blob/main/dropdown_searchable.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/dropdown_searchable))
- [Single Select](https://github.com/declarativeforms/examples/blob/main/single_select.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/single_select))
- [Multiple Select](https://github.com/declarativeforms/examples/blob/main/multiple_select.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/multiple_select))
- [Rating](https://github.com/declarativeforms/examples/blob/main/rating.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/rating))
- [Options with Label/Value](https://github.com/declarativeforms/examples/blob/main/options_label_value.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/options_label_value))

#### Advanced

- [Address](https://github.com/declarativeforms/examples/blob/main/address.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/address))
- [Address (Structured Output)](https://github.com/declarativeforms/examples/blob/main/address_structured.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/address_structured))
- [File Upload](https://github.com/declarativeforms/examples/blob/main/file_upload.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/file_upload))
- [Signature](https://github.com/declarativeforms/examples/blob/main/signature.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/signature))
- [Hidden](https://github.com/declarativeforms/examples/blob/main/hidden.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/hidden))

### Form Logic

- [Validators](https://github.com/declarativeforms/examples/blob/main/validators.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/validators))
- [Conditional Visibility](https://github.com/declarativeforms/examples/blob/main/visible_when.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/visible_when))
- [Conditional Navigation](https://github.com/declarativeforms/examples/blob/main/conditional_navigation.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/conditional_navigation))
- [Prefill via URL](https://github.com/declarativeforms/examples/blob/main/prefill.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/prefill?name=Jane&email=jane@example.com))

### Connections

- [Webhook](https://github.com/declarativeforms/examples/blob/main/connections_webhook.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/connections_webhook))
- [Email](https://github.com/declarativeforms/examples/blob/main/connections_email.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/connections_email))
- [Airtable](https://github.com/declarativeforms/examples/blob/main/connections_airtable.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/connections_airtable))

### Form Settings

- [Custom Completion Page](https://github.com/declarativeforms/examples/blob/main/completion.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/completion))
- [Start Date](https://github.com/declarativeforms/examples/blob/main/start_date.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/start_date))
- [End Date](https://github.com/declarativeforms/examples/blob/main/end_date.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/end_date))
- [Localization](https://github.com/declarativeforms/examples/blob/main/localization.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/localization))
- [Mixpanel](https://github.com/declarativeforms/examples/blob/main/mixpanel.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/mixpanel))

## Localization (Platform Strings)

Platform-owned UI strings support browser locale detection with an optional query override:

- Browser locale fallback (for example `en-US` -> `en`).
- Force locale with `?lang=<code>` (for example `?lang=es`).
- Current supported locales: `en`, `es`.
- Optional form-level lock: set `locale` in the form config to force platform locale for that form.

## Form Content Localization

Form-authored strings can now be either:

- A plain string (default behavior)
- A locale map object (for example `{ en: "...", es: "..." }`)

Locale map fallback order:

1. Active locale (`?lang`, browser locale, or form `locale` lock)
2. `en`
3. First available translation value

### Example: Localized labels and placeholders

```yaml
title:
  en: "Customer Feedback"
  es: "Opinión del cliente"

sections:
  - id: main
    title:
      en: "Contact"
      es: "Contacto"
    fields:
      - id: name
        type: short_text
        label:
          en: "Your name"
          es: "Tu nombre"
        placeholder:
          en: "Type your name"
          es: "Escribe tu nombre"
    next: done
```

### Example: Localized options with stable values

Use option objects when translating selectable labels, so submission values remain stable:

```yaml
- id: consent
  type: single_select
  label:
    en: "Would you like to continue?"
    es: "¿Quieres continuar?"
  options:
    - value: yes
      label:
        en: "Yes"
        es: "Sí"
    - value: no
      label:
        en: "No"
        es: "No"
```

## Options with Label/Value

By default, option values in `dropdown`, `single_select`, and `multiple_select` fields use the display string as both the label and the stored value. To decouple them, use the `{ label, value }` object syntax:

```yaml
- id: country
  type: dropdown
  label: Country
  options:
    - value: us
      label: "United States"
    - value: gb
      label: "United Kingdom"
```

The `label` is shown to the user; the `value` is what gets stored in submissions. This is useful when display text may change or when you need stable identifiers for downstream processing.

## Address Structured Output

By default, address fields store a plain formatted string. Set `outputFormat: "structured"` to receive a structured object with individual address components:

```yaml
- id: home_address
  type: address
  label: Home address
  outputFormat: structured
```

The structured output includes: `formatted_address`, `street_number`, `route`, `locality`, `administrative_area_level_1`, `country`, `postal_code`, and `place_id`.

## The 48-Hour Promise

Most form platforms have feature request boards where ideas go to die. Hundreds of requests, some over 18 months old, sitting in a backlog that never moves.

We do things differently. Open a [GitHub Issue](https://github.com/declarativeforms/examples/issues) with your feature request — if it genuinely improves the product, we'll ship it within 48 hours.

No waitlists. No roadmap purgatory. No "we'll consider it." Just open an issue and watch it get built.
