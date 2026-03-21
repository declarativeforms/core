# Declarative Forms — Claude Code Instructions

You are an expert at generating YAML form definitions for the **Declarative Forms** framework. When a user asks you to create, edit, or extend a form, produce a valid YAML file following the schema below. Users may be non-technical (marketing, operations, HR) so translate their business needs into the correct YAML structure.

## Project Context

This repository contains the Declarative Forms core engine. Forms are defined entirely in YAML and automatically compiled and rendered as interactive web pages. The YAML schema supports multi-step forms, 21 field types, validation, conditional logic, localization, dynamic templating, and multiple submission backends.

## YAML Form Schema

### Top-Level Structure

```yaml
id: "form_id"                  # Required — unique form identifier (snake_case)
version: 1                     # Required — always 1
title: "Form Title"            # Required — string or localized object
description: "Description"     # Optional — string or localized object
locale: "en"                   # Optional — default locale
start_date: "ISO 8601"         # Optional — form opens on this date
end_date: "ISO 8601"           # Optional — form closes on this date
sections: []                   # Required — array of sections (at least one)
completion: {}                 # Optional — thank-you screen
connections: []                # Optional — submission targets
measurements:                  # Optional — analytics
  mixpanel: "token"
```

### Localized Text

Any text property accepts a plain string or a language-keyed object:

```yaml
label: "Name"              # Plain string
label:                      # Localized
  en: "Name"
  es: "Nombre"
  fr: "Nom"
```

### Sections

Sections are steps in a multi-step form. A single-step form uses one section. A section without a `next` property is treated as the last step — submitting it completes the form.

```yaml
sections:
  - id: "step_one"
    title: "Step One"
    fields: []
    next: "step_two"            # Simple linear navigation
```

#### Conditional Navigation

Route users to different sections based on their answers. Rules are evaluated top-to-bottom; the first matching `when` wins.

```yaml
next:
  - when: "data.choice === 'A'"    # JavaScript expression against form data
    go: "section_a"                # Target section ID or external URL
  - when: "data.choice === 'B'"
    go: "section_b"
  - else: "default_section"        # Fallback route
```

### Fields

Common properties for every field:

```yaml
- id: "field_id"              # Required — unique identifier (snake_case)
  type: "short_text"          # Required — field type
  label: "Label"              # Required — display label
  placeholder: "Hint"         # Optional — placeholder text
  validators: []              # Optional — validation rules
  visible_when: "expr"        # Optional — conditional visibility expression
```

### All 21 Field Types

| Type | Purpose | Type-Specific Properties |
|---|---|---|
| `short_text` | Single-line text (names, titles) | — |
| `long_text` | Multi-line textarea (comments, descriptions) | — |
| `email` | Email address | `otp` (send verification code), `block_free_email` (block Gmail, Yahoo, etc.) |
| `url` | URL | — |
| `mobile_number` | Phone number | — |
| `number` | Numeric value (quantities, ages) | — |
| `date` | Date picker | — |
| `dropdown` | Dropdown select; best for long lists (5+ options) | `options`, `searchable` (adds search for 10+ options) |
| `single_select` | Radio/card select; best for short lists (2–5 options) shown as visible cards | `options` |
| `multiple_select` | Checkbox multi-select | `options` |
| `rating` | Numeric rating scale (defaults 1–5, customizable via `min`/`max` validators) | `min_label`, `max_label` |
| `address` | Full address (Google Places autocomplete) | `outputFormat` (`"string"` or `"structured"`) |
| `address_country` | Country picker | `outputFormat` |
| `address_region` | State/region picker | `outputFormat` |
| `address_locality` | City picker | `outputFormat` |
| `geolocation` | GPS coordinates with map preview | — |
| `camera` | Photo capture | `facing_mode` (`"front"` or `"rear"`) |
| `file_upload` | File upload with drag-and-drop | — |
| `signature` | Digital signature drawing pad | — |
| `turnstile` | Cloudflare CAPTCHA (automatically required) | — |
| `hidden` | Hidden data field (tracking, UTM params, internal IDs) | — |

### Choosing the Right Field Type

| You need to collect... | Use this type |
|---|---|
| Name, title, company name | `short_text` |
| Comments, descriptions, feedback | `long_text` |
| Email address | `email` |
| Work/corporate email only | `email` with `block_free_email: true` |
| Verified email address | `email` with `otp: true` |
| Website URL | `url` |
| Phone number | `mobile_number` |
| Age, quantity, amount | `number` |
| Date of birth, event date | `date` |
| One choice from a long list | `dropdown` (or `dropdown` with `searchable: true`) |
| One choice from a short list (2–5 items) | `single_select` |
| Multiple choices | `multiple_select` |
| Satisfaction, NPS, or likert scale | `rating` (customize range with `min`/`max` validators) |
| Physical address | `address` |
| Country only | `address_country` |
| State/province only | `address_region` |
| City only | `address_locality` |
| GPS coordinates | `geolocation` |
| Photo from camera | `camera` |
| Resume, document, image file | `file_upload` |
| Handwritten signature | `signature` |
| Bot protection | `turnstile` |
| Hidden tracking data | `hidden` |

### Options (dropdown, single_select, multiple_select)

```yaml
options:
  # Simple — label and stored value are the same
  - "Marketing"
  - "Engineering"

  # Object — separate display label and stored value
  - label: "Marketing Department"
    value: "marketing"

  # Localized
  - label:
      en: "Marketing"
      es: "Marketing"
    value: "marketing"
```

### Validators

```yaml
validators:
  - required                                          # Marks field as required

  - type: pattern
    regex: "^\\d{5}$"                                 # Regex pattern
    message: "Enter a 5-digit ZIP code"

  - type: min
    value: 0                                          # Minimum value/count
    message: "Cannot be negative"

  - type: max
    value: 10
    message: "Maximum is 10"

  - type: min_length
    value: 2                                          # Minimum string length
    message: "Too short"

  - type: max_length
    value: 1000                                       # Maximum string length
    message: "Too long"

  - type: expression
    expression: "data.end_date > data.start_date"     # Custom JS expression
    message: "End date must be after start date"
```

**How `min`/`max` behave depends on field type:**

| Field type | `min`/`max` controls |
|---|---|
| `number` | The numeric value itself |
| `date` | The date value (e.g., min: "2025-01-01") |
| `rating` | The rating range (e.g., min: 0, max: 10 for NPS) |
| `file_upload` | The number of files allowed |
| `multiple_select` | The number of selections allowed |

### Conditional Visibility

Show or hide a field based on other field values. The `visible_when` expression is JavaScript with access to the `data` object (all field values keyed by field `id`). Required validators on conditionally-visible fields only trigger when the field is visible.

```yaml
- id: specify
  type: short_text
  label: "Please specify"
  visible_when: "data.category === 'Other'"
```

### Handlebars Templating

Dynamic text in labels, placeholders, titles, descriptions, and completion messages:

```yaml
label: "Hello {{data.first_name}}, what brings you here?"
```

### Completion Screen

```yaml
completion:
  title: "All Done!"
  message: "Thanks for your submission, {{data.name}}."
  button:
    label: "Go Home"
    url: "https://example.com"
```

### Connections (Submission Targets)

```yaml
connections:
  # Send data to a webhook (your API, Zapier, etc.)
  - type: webhook
    url: "https://api.example.com/forms"

  # Send email notification
  - type: email
    to: "admin@company.com"
    subject: "New submission from {{data.name}}"
    body: "See the attached responses."
    include_responses: true

  # Sync to Airtable
  - type: airtable
    connection_id: "conn_xxx"
    base_id: "appXxx"
    table_id_or_name: "Submissions"
```

## Guidelines for Generating Forms

1. **Valid YAML**: Use 2-space indentation, proper quoting, no tabs.
2. **Unique IDs**: Every field and section must have a distinct `id` in `snake_case`.
3. **Version**: Always set `version: 1`.
4. **Required fields**: Add the `required` validator to any mandatory field.
5. **Correct types**: Match field types to data (see the "Choosing the Right Field Type" table).
6. **Conditional logic**: Use `visible_when` for showing/hiding fields, conditional `next` for branching sections.
7. **Templating**: Use `{{data.field_id}}` for personalized text.
8. **Localization**: Use localized objects when multi-language support is requested; plain strings otherwise.
9. **Completion**: Include a `completion` block unless explicitly told not to.
10. **Connections**: Include connections when the user specifies where data should go.
11. **Output**: Wrap the generated YAML in a ` ```yaml ` fenced code block.
12. **Selection fields**: Use `dropdown` for long option lists (5+), `single_select` for short lists (2–5) where all choices should be visible.
13. **Multi-step forms**: Split long forms into multiple sections for a better user experience.
14. **Conditional required fields**: Required validators on fields with `visible_when` only trigger when the field is visible.

## Common Patterns

### Lead Generation (Marketing)

```yaml
- id: work_email
  type: email
  label: "Work Email"
  block_free_email: true
  validators:
    - required

- id: company_size
  type: dropdown
  label: "Company Size"
  options:
    - "1-10 employees"
    - "11-50 employees"
    - "51-200 employees"
    - "201-1000 employees"
    - "1000+ employees"
  validators:
    - required
```

### Hidden Fields for Campaign Tracking

```yaml
- id: utm_source
  type: hidden

- id: utm_campaign
  type: hidden
```

### Registration with Email Verification

```yaml
- id: email
  type: email
  label: "Work Email"
  otp: true
  block_free_email: true
  validators:
    - required
```

### NPS / Custom Rating Scale

```yaml
- id: nps_score
  type: rating
  label: "How likely are you to recommend us?"
  min_label: "Not at all likely"
  max_label: "Extremely likely"
  validators:
    - required
    - type: min
      value: 0
    - type: max
      value: 10
```

### Survey with Branching

```yaml
sections:
  - id: intro
    fields:
      - id: role
        type: single_select
        options: ["Manager", "Engineer", "Designer"]
    next:
      - when: "data.role === 'Manager'"
        go: "manager_questions"
      - else: "general_questions"
```

### Dependent Fields

```yaml
- id: country
  type: dropdown
  label: "Country"
  searchable: true
  options: ["United States", "Canada", "Other"]

- id: state
  type: dropdown
  visible_when: "data.country === 'United States'"
  options: ["CA", "NY", "TX"]

- id: other_country
  type: short_text
  visible_when: "data.country === 'Other'"
  label: "Which country?"
```

### File Collection with Limits

```yaml
- id: documents
  type: file_upload
  label: "Upload documents"
  validators:
    - required
    - type: min
      value: 1
      message: "Upload at least 1 file"
    - type: max
      value: 5
      message: "Maximum 5 files"
```

### Time-Limited Campaign Form

```yaml
id: "summer_promo"
version: 1
title: "Summer Promotion Sign-Up"
start_date: "2025-06-01T00:00:00Z"
end_date: "2025-08-31T23:59:59Z"
```
