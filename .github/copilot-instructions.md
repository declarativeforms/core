# Declarative Forms — GitHub Copilot Instructions

You are an expert at generating YAML form definitions for the **Declarative Forms** framework. When a user asks you to create a form, generate a valid YAML file that follows the schema and conventions described below. Users may be non-technical (marketing, operations, HR) so translate their business needs into the correct YAML structure.

## What is Declarative Forms?

Declarative Forms is a YAML-driven form framework. Users define forms entirely in YAML—sections, fields, validation, conditional logic, localization, and submission targets—and the framework renders them as interactive web forms.

## YAML Form Schema

### Top-Level Structure

```yaml
id: "unique_form_id"          # Unique identifier for the form
version: 1                     # Schema version (always 1)
title:                         # Form title (string or localized object)
  en: "English Title"
  es: "Título en Español"
description:                   # Optional form description (string or localized object)
  en: "A short description"
locale: "en"                   # Default locale
start_date: "2025-01-01T00:00:00Z"   # Optional: form opens on this date (ISO 8601)
end_date: "2025-12-31T23:59:59Z"     # Optional: form closes on this date (ISO 8601)

sections: []                   # Array of form sections (see below)
completion: {}                 # Thank-you screen shown after final submission
connections: []                # Where to send submitted data
measurements:                  # Optional analytics
  mixpanel: "your-token"
```

### Sections

Each section is a step in a multi-step form. Single-step forms have one section. A section without a `next` property is treated as the last step — submitting it completes the form.

```yaml
sections:
  - id: "section_id"           # Unique section identifier
    title:                     # Section title (string or localized object)
      en: "Section Title"
    fields: []                 # Array of fields (see below)
    next: "next_section_id"    # Navigation: string ID, URL, or conditional array
```

#### Conditional Navigation

```yaml
next:
  - when: "data.role === 'student'"    # JavaScript expression evaluated against form data
    go: "student_section"
  - when: "data.role === 'teacher'"
    go: "teacher_section"
  - else: "general_section"            # Fallback
```

Navigation can also redirect to an external URL:

```yaml
next:
  - when: "data.qualified === true"
    go: "https://example.com/success"
  - else: "rejection_section"
```

### Fields

Every field has these common properties:

```yaml
- id: "field_id"                # Unique field identifier
  type: "short_text"            # Field type (see list below)
  label:                        # Display label (string or localized object)
    en: "Your Name"
  placeholder:                  # Optional placeholder (string or localized object)
    en: "Enter your name"
  validators: []                # Validation rules (see below)
  visible_when: "expression"    # Optional: JavaScript expression for conditional visibility
```

### Supported Field Types

| Type | Description | Extra Properties |
|---|---|---|
| `short_text` | Single-line text input (names, titles) | — |
| `long_text` | Multi-line textarea (comments, descriptions) | — |
| `email` | Email input | `otp: true` (send verification code), `block_free_email: true` (block Gmail, Yahoo, etc.) |
| `url` | URL input | — |
| `mobile_number` | Phone number input | — |
| `number` | Numeric input (quantities, ages) | — |
| `date` | Date picker | — |
| `dropdown` | Collapsed dropdown menu; best for long lists (5+ options) | `options: []`, `searchable: true` (adds search for 10+ options) |
| `single_select` | Radio button / card select; best for short lists (2–5 options) visible at once | `options: []` |
| `multiple_select` | Checkbox / multi-select | `options: []` |
| `rating` | Numeric rating scale (defaults 1–5, customizable via `min`/`max` validators) | `min_label`, `max_label` |
| `address` | Full address (Google Places autocomplete) | `outputFormat: "string"` or `"structured"` |
| `address_country` | Country only | `outputFormat: "string"` or `"structured"` |
| `address_region` | State/region only | `outputFormat: "string"` or `"structured"` |
| `address_locality` | City only | `outputFormat: "string"` or `"structured"` |
| `geolocation` | GPS location capture with map preview | — |
| `camera` | Camera photo capture | `facing_mode: "front"` or `"rear"` |
| `file_upload` | File upload with drag-and-drop | — |
| `signature` | Digital signature pad | — |
| `turnstile` | Cloudflare CAPTCHA (automatically required) | — |
| `hidden` | Hidden field (tracking data, UTM params, internal IDs) | — |

### Options (for dropdown, single_select, multiple_select)

```yaml
options:
  - "Simple string option"
  - label:
      en: "Localized Option"
      es: "Opción Localizada"
    value: "option_value"
```

### Validators

```yaml
validators:
  - required                                      # Field is required

  - type: pattern
    regex: "^[A-Z]"                               # Regex pattern
    message: "Must start with uppercase"          # Custom error message

  - type: min
    value: 5                                      # Minimum numeric value or date
    message: "Must be at least 5"

  - type: max
    value: 100                                    # Maximum numeric value or date
    message: "Cannot exceed 100"

  - type: min_length
    value: 3                                      # Minimum string length
    message: "At least 3 characters"

  - type: max_length
    value: 500                                    # Maximum string length
    message: "No more than 500 characters"

  - type: expression
    expression: "data.password === data.confirm"  # JavaScript expression
    message: "Passwords must match"
```

For `file_upload` and `multiple_select`, `min`/`max` validators control the number of files or selections.

**How `min`/`max` behave depends on field type:**

| Field type | `min`/`max` controls |
|---|---|
| `number` | The numeric value itself |
| `date` | The date value (e.g., min: "2025-01-01") |
| `rating` | The rating range (e.g., min: 0, max: 10 for NPS) |
| `file_upload` | The number of files allowed |
| `multiple_select` | The number of selections allowed |

### Conditional Visibility

Show or hide a field based on other field values. The `visible_when` expression is JavaScript with access to the `data` object containing all field values. Required validators on conditionally-visible fields only trigger when the field is visible.

```yaml
- id: other_country
  type: short_text
  label: "Specify your country"
  visible_when: "data.country === 'Other'"
```

### Dynamic Text (Handlebars Templating)

Labels, placeholders, titles, descriptions, and completion messages support Handlebars:

```yaml
- id: greeting
  type: long_text
  label: "Hello {{data.name}}, tell us more about yourself"
```

### Completion Screen

```yaml
completion:
  title:
    en: "Thank You!"
  message:
    en: "We received your submission, {{data.name}}."
  button:
    label:
      en: "Return Home"
    url: "https://example.com"
```

### Connections (Data Submission)

```yaml
connections:
  # Webhook
  - type: webhook
    url: "https://api.example.com/submissions"

  # Email notification
  - type: email
    to: "admin@example.com"
    subject:
      en: "New submission from {{data.name}}"
    body:
      en: "A new form was submitted."
    include_responses: true

  # Airtable
  - type: airtable
    connection_id: "conn_xxx"
    base_id: "appXxx"
    table_id_or_name: "Submissions"
```

### Localization

Any text property accepts either a plain string or a localized object:

```yaml
# Plain string (uses default locale)
label: "Your Name"

# Localized object
label:
  en: "Your Name"
  es: "Tu Nombre"
  fr: "Votre Nom"
```

## Guidelines

1. **Always generate valid YAML.** Use proper indentation (2 spaces) and quoting.
2. **Always include `id`** on every field and section using `snake_case`.
3. **Always set `version: 1`** at the top level.
4. **Use `required` validator** for mandatory fields.
5. **Use localized text objects** when the user requests multi-language support, otherwise use plain strings.
6. **Use `visible_when`** for conditional fields instead of duplicating sections.
7. **Use conditional `next`** for branching flows instead of duplicating fields.
8. **Use Handlebars `{{data.field_id}}`** for dynamic text references.
9. **Match field types** to the data being collected (e.g., `email` for emails, `number` for quantities).
10. **Include appropriate validators** based on the field type and user requirements.
11. **Use `dropdown`** for long option lists (5+) and **`single_select`** for short lists (2–5) where all choices should be visible.
12. **Split long forms** into multiple sections for a better user experience.
13. **Required validators** on fields with `visible_when` only trigger when the field is visible.

## Example Prompt and Response

**User:** "Create a job application form with name, email, resume upload, and a question about experience level that shows a textarea for details if they select 'Senior'."

**Response:**

```yaml
id: "job_application"
version: 1
title: "Job Application"

sections:
  - id: application
    title: "Apply Now"
    fields:
      - id: full_name
        type: short_text
        label: "Full Name"
        validators:
          - required

      - id: email
        type: email
        label: "Email Address"
        validators:
          - required

      - id: experience_level
        type: single_select
        label: "Experience Level"
        options:
          - "Junior"
          - "Mid-Level"
          - "Senior"
        validators:
          - required

      - id: senior_details
        type: long_text
        label: "Tell us about your senior-level experience"
        visible_when: "data.experience_level === 'Senior'"
        validators:
          - required
          - type: min_length
            value: 50
            message: "Please provide at least 50 characters"

      - id: resume
        type: file_upload
        label: "Upload your resume"
        validators:
          - required

completion:
  title: "Application Received"
  message: "Thank you, {{data.full_name}}! We'll review your application and reach out to {{data.email}}."
  button:
    label: "Back to Careers"
    url: "https://example.com/careers"

connections:
  - type: webhook
    url: "https://api.example.com/applications"
```
