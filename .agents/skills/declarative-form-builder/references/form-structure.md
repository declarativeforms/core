# Form Structure Reference

This document covers the full Declarative Forms YAML schema: top-level properties, sections, connections, completion screens, theming, and localization.

---

## Top-level structure

```yaml
version: 1                    # Required. Always 1.
title: "Form title"           # Displayed at the top of the form.
description: "Short intro"    # Displayed below the title.
locale: "en"                  # BCP 47 locale tag. Used for localized text fallback.

theme:
  primary: "#4F46E5"          # Hex color for buttons, focus rings, and accents.

start_date: "2026-01-01"     # ISO date. Form is inaccessible before this date.
end_date: "2026-12-31"       # ISO date. Form is inaccessible after this date.

sections:                     # Required. At least one section.
  - ...

completion:                   # Optional. Customizes the thank-you screen.
  ...

connections:                  # Optional. Where to send submissions.
  - ...
```

---

## Sections

A form is divided into one or more sections. Each section is a "page" of the form. Respondents move through sections one at a time.

```yaml
sections:
  - id: section_1             # Required. Unique snake_case identifier.
    title: "Section title"    # Displayed at the top of the section.
    fields:
      - ...                   # List of fields (see field-types.md)
    next: section_2           # Where to go after this section is submitted.
```

### The `next` property

`next` controls navigation after a section is submitted.

**Simple — always go to the next section or finish:**

```yaml
next: section_2    # Go to section_2
next: done         # Complete the form
```

**Conditional — branch based on field values:**

```yaml
next:
  - when: "data.rating <= 2"
    go: "concerns"
  - when: "data.vip === 'Yes'"
    go: "vip_section"
  - else: "general"    # Fallback if no when-rule matches
```

**External redirect — send to a URL:**

```yaml
next:
  - when: "data.country === 'US'"
    go: "https://us.example.com"
  - else: "done"
```

Rules are evaluated in order. The first matching `when` wins. `else` is the fallback and should always be last.

---

## Completion screen

The completion screen is shown after the form is submitted.

### Simple (same message for everyone)

```yaml
completion:
  title: "Thank you!"
  message: "We will be in touch soon."
  button:
    label: "Go back to our website"
    url: "https://example.com"
```

### Conditional (different messages based on answers)

```yaml
completion:
  - when: "data.rating <= 2"
    title: "We are sorry to hear that"
    message: "Our team will follow up with you soon."
  - title: "Thank you!"           # No when = default fallback
    message: "We appreciate your response."
```

The last entry without a `when` is the default. Rules are evaluated in order.

---

## Connections

Connections run when a form submission is **completed** (all sections submitted).

### Email connection

Sends the submission to an email address.

```yaml
connections:
  - type: email
    to: "ops@example.com"              # Required. Plain email address (no templates).
    subject: "New submission from {{data.full_name}}"  # Template allowed.
    body: "Reply to {{data.email}}."   # Template allowed.
    include_responses: true            # Attaches all field values to the email.
    when: "data.priority === 'High'"   # Optional. Only send if expression is true.
```

**Template syntax:** Use `{{data.field_id}}` to insert a field value into `subject` or `body`.

### Webhook connection

Sends the full submission as JSON to a URL (Zapier, Make, n8n, custom endpoint).

```yaml
connections:
  - type: webhook
    url: "https://hooks.zapier.com/hooks/catch/your-hook-id"
    when: "data.status === 'urgent'"   # Optional.
```

The webhook payload shape:

```json
{
  "id": "ab12cd34",
  "form_id": "c979ac5b",
  "created_at": "2026-03-16T10:00:00.000Z",
  "updated_at": "2026-03-16T10:00:00.000Z",
  "status": "completed",
  "data": {
    "field_id": "value"
  },
  "metadata": {
    "ip_address": "203.0.113.10",
    "user_agent": "Mozilla/5.0"
  }
}
```

### Airtable connection

Writes a new row into an Airtable base.

```yaml
connections:
  - type: airtable
    connection_id: "my_airtable_connection"  # Pre-configured connection name.
    base_id: "appXXXXXXXXXXXXXX"
    table_id_or_name: "Submissions"
    when: "data.consent === 'Yes'"           # Optional.
```

### Multiple connections

You can have as many connections as you need. All matching connections run (those whose `when` expression evaluates to true, or those with no `when` at all).

```yaml
connections:
  - type: email
    to: "team@example.com"
    subject: "New submission"
    include_responses: true

  - type: email
    to: "escalations@example.com"
    subject: "Urgent: {{data.full_name}}"
    when: "data.priority === 'High'"

  - type: webhook
    url: "https://hooks.zapier.com/hooks/catch/your-hook-id"
```

---

## Localization

Any text field (`title`, `description`, `label`, `placeholder`, `message`, etc.) can be a plain string or a localization object.

```yaml
locale: "fr-CA"            # Fallback chain: fr-CA → fr → en

title:
  en: "Contact us"
  fr: "Contactez-nous"

sections:
  - id: section_1
    title:
      en: "Your details"
      fr: "Vos coordonnées"
    fields:
      - id: full_name
        type: short_text
        label:
          en: "Full name"
          fr: "Nom complet"
        placeholder:
          en: "Jane Smith"
          fr: "Jane Dupont"
        validators:
          - required

    next: done

completion:
  title:
    en: "Thank you"
    fr: "Merci"
  message:
    en: "Your submission has been received."
    fr: "Votre soumission a bien été reçue."
```

---

## Theming

Use the `theme` block to change the form's primary color.

```yaml
theme:
  primary: "#4F46E5"    # Any hex color (#RGB or #RRGGBB).
```

The primary color applies to buttons, focus rings, and active states. Button text color is automatically adjusted for contrast.

---

## Date gating

Use `start_date` and `end_date` to restrict when the form is accessible.

```yaml
start_date: "2026-06-01"    # Form opens on this date (ISO 8601).
end_date: "2026-06-30"      # Form closes after this date (ISO 8601).
```

Both are optional. You can use one or both.

---

## Hidden fields and URL prefill

Any field can be prefilled from a URL query parameter using the field's `id` as the parameter name.

```yaml
- id: source
  type: hidden
  label: "Source"
```

Prefill with: `https://frms.dev/example?source=google`

This works for visible fields too — the field appears pre-populated.

---

## Conditional field visibility

Use `visible_when` on a field to show it only when a condition is true.

```yaml
- id: company_name
  type: short_text
  label: "Company name"
  visible_when: "data.inquiry_type === 'Business'"
```

The expression is a JavaScript snippet evaluated against all current field values. Fields hidden by `visible_when` are excluded from validation and submission data.

**Common patterns:**

```yaml
# Equal to a value
visible_when: "data.field === 'value'"

# Not equal
visible_when: "data.field !== 'value'"

# Numeric comparison
visible_when: "data.age >= 18"

# Multiple conditions (AND)
visible_when: "data.type === 'Business' && data.size === 'Large'"

# Multiple conditions (OR)
visible_when: "data.country === 'US' || data.country === 'CA'"
```

---

## Full example

See `assets/example-form.yaml` for a complete, annotated working example.
