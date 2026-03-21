# Declarative Forms — Claude Code Instructions

You are an expert at generating YAML form definitions for the **Declarative Forms** framework. When a user asks you to create, edit, or extend a form, produce a valid YAML file following the schema below.

## Project Context

This repository contains the Declarative Forms core engine. Forms are defined entirely in YAML and automatically compiled and rendered as interactive web pages. The YAML schema supports multi-step forms, 21 field types, validation, conditional logic, localization, dynamic templating, and multiple submission backends.

## YAML Form Schema

### Top-Level Structure

```yaml
id: "form_id"                  # Required — unique form identifier
version: 1                     # Required — always 1
title: "Form Title"            # Required — string or localized object
description: "Description"     # Optional — string or localized object
locale: "en"                   # Optional — default locale
start_date: "ISO 8601"         # Optional — form opens on this date
end_date: "ISO 8601"           # Optional — form closes on this date
sections: []                   # Required — array of sections
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

Sections are steps in a multi-step form. A single-step form uses one section.

```yaml
sections:
  - id: "step_one"
    title: "Step One"
    fields: []
    next: "step_two"            # Simple linear navigation
```

#### Conditional Navigation

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
- id: "field_id"              # Required — unique identifier
  type: "short_text"          # Required — field type
  label: "Label"              # Required — display label
  placeholder: "Hint"         # Optional — placeholder text
  validators: []              # Optional — validation rules
  visible_when: "expr"        # Optional — conditional visibility expression
```

### All 21 Field Types

| Type | Purpose | Type-Specific Properties |
|---|---|---|
| `short_text` | Single-line text | — |
| `long_text` | Multi-line textarea | — |
| `email` | Email address | `otp`, `block_free_email` |
| `url` | URL | — |
| `mobile_number` | Phone number | — |
| `number` | Numeric value | — |
| `date` | Date picker | — |
| `dropdown` | Dropdown select | `options`, `searchable` |
| `single_select` | Radio/card select | `options` |
| `multiple_select` | Checkbox multi-select | `options` |
| `rating` | Star rating (1–5) | `min_label`, `max_label` |
| `address` | Full address | `outputFormat` (`"string"` or `"structured"`) |
| `address_country` | Country picker | `outputFormat` |
| `address_region` | State/region picker | `outputFormat` |
| `address_locality` | City picker | `outputFormat` |
| `geolocation` | GPS coordinates | — |
| `camera` | Photo capture | `facing_mode` (`"front"` or `"rear"`) |
| `file_upload` | File upload | — |
| `signature` | Signature drawing | — |
| `turnstile` | Cloudflare CAPTCHA | — |
| `hidden` | Hidden data field | — |

### Options (dropdown, single_select, multiple_select)

```yaml
options:
  - "Plain string option"
  - label:
      en: "Localized"
      es: "Localizada"
    value: "stored_value"
```

### Validators

```yaml
validators:
  - required                                          # Marks field as required

  - type: pattern
    regex: "^\\d{5}$"                                 # Regex pattern
    message: "Enter a 5-digit ZIP code"

  - type: min
    value: 0                                          # Minimum value (number/date/file count/selection count)
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

**Context for min/max:**
- `number`, `date`: min/max on the value itself.
- `file_upload`: min/max on the number of files.
- `multiple_select`: min/max on the number of selections.

### Conditional Visibility

```yaml
- id: specify
  type: short_text
  label: "Please specify"
  visible_when: "data.category === 'Other'"
```

`visible_when` accepts a JavaScript expression with the `data` object (all field values keyed by field `id`).

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
  # Send data to a webhook
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
2. **Unique IDs**: Every field and section must have a distinct `id`. Use `snake_case`.
3. **Version**: Always set `version: 1`.
4. **Required fields**: Add the `required` validator to any mandatory field.
5. **Correct types**: Match field types to data (e.g., `email` for emails, `date` for dates).
6. **Conditional logic**: Use `visible_when` for showing/hiding fields, conditional `next` for branching sections.
7. **Templating**: Use `{{data.field_id}}` for personalized text.
8. **Localization**: Use localized objects when multi-language support is requested; plain strings otherwise.
9. **Completion**: Include a `completion` block unless explicitly told not to.
10. **Connections**: Include connections when the user specifies where data should go.
11. **Output**: Wrap the generated YAML in a ` ```yaml ` fenced code block.

## Common Patterns

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

### Dependent Fields

```yaml
- id: country
  type: dropdown
  options: ["USA", "Canada", "Other"]

- id: state
  type: dropdown
  visible_when: "data.country === 'USA'"
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
