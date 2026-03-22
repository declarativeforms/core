# Field Types Reference

This document covers every field type supported by Declarative Forms. Load this file when you need the full details of a specific field type.

---

## Common properties (all field types)

Every field supports these properties:

```yaml
- id: field_id           # Required. Unique snake_case identifier.
  type: short_text       # Required. See types below.
  label: "Label text"    # Displayed above the field.
  placeholder: "Hint"    # Light text shown inside the field.
  visible_when: "..."    # JavaScript expression. Field is hidden unless true.
  validators:
    - required           # Field must be filled in.
    - type: expression
      expression: "..."  # Custom JavaScript expression. Must return true to pass.
      message: "..."     # Error shown when validation fails.
```

---

## short_text

Single-line text input. Use for names, short answers, company names.

```yaml
- id: full_name
  type: short_text
  label: "Full name"
  placeholder: "Jane Smith"
  validators:
    - required
    - type: min_length
      value: 2
      message: "Please enter at least 2 characters."
    - type: max_length
      value: 100
      message: "Please enter no more than 100 characters."
    - type: pattern
      regex: "^[A-Za-z ]+$"
      message: "Letters and spaces only."
```

---

## long_text

Multi-line text area. Use for messages, descriptions, feedback.

```yaml
- id: message
  type: long_text
  label: "Message"
  placeholder: "Tell us more..."
  validators:
    - required
    - type: min_length
      value: 20
      message: "Please write at least 20 characters."
    - type: max_length
      value: 2000
      message: "Please keep your message under 2000 characters."
```

---

## email

Email address input with built-in format validation.

```yaml
- id: email
  type: email
  label: "Email address"
  placeholder: "jane@example.com"
  otp: true              # Send a one-time code to verify ownership.
  block_free_email: true # Reject Gmail, Hotmail, etc. (work emails only).
  validators:
    - required
```

---

## number

Numeric input. Use for ages, quantities, amounts.

```yaml
- id: age
  type: number
  label: "Age"
  placeholder: "25"
  validators:
    - required
    - type: min
      value: 18
      message: "You must be at least 18."
    - type: max
      value: 120
      message: "Please enter a valid age."
```

---

## date

Date picker (day, month, year).

```yaml
- id: birth_date
  type: date
  label: "Date of birth"
  validators:
    - required
```

---

## date_month

Month and year picker only (no day).

```yaml
- id: start_month
  type: date_month
  label: "When did you start?"
  validators:
    - required
```

---

## time

Time picker (hours and minutes).

```yaml
- id: preferred_time
  type: time
  label: "Preferred time"
  validators:
    - required
```

---

## url

URL input with built-in format validation.

```yaml
- id: website
  type: url
  label: "Website"
  placeholder: "https://example.com"
  validators:
    - required
```

---

## mobile_number

International phone number input.

```yaml
- id: phone
  type: mobile_number
  label: "Phone number"
  placeholder: "+1 555 123 4567"
  validators:
    - required
```

---

## dropdown

Pick one option from a list. Use for long option lists (supports optional search).

```yaml
- id: country
  type: dropdown
  label: "Country"
  searchable: true       # Adds a search box inside the dropdown.
  options:
    - "United States"
    - "United Kingdom"
    - "Canada"
    - "Australia"
  validators:
    - required
```

Options can also have separate display labels and stored values:

```yaml
options:
  - label: "United States"
    value: "us"
  - label: "United Kingdom"
    value: "gb"
```

---

## single_select

Pick exactly one option from a visible list of radio-button-style choices.

```yaml
- id: inquiry_type
  type: single_select
  label: "Type of inquiry"
  options:
    - "Personal"
    - "Business"
    - "Press"
  allow_other: true       # Adds an "Other" option with a free-text input.
  validators:
    - required
```

---

## multiple_select

Pick one or more options from a list (checkboxes).

```yaml
- id: interests
  type: multiple_select
  label: "Areas of interest"
  options:
    - "Design"
    - "Engineering"
    - "Marketing"
    - "Sales"
  allow_other: true        # Adds an "Other" option with a free-text input.
  validators:
    - required
    - type: min
      value: 1
      message: "Please select at least one option."
    - type: max
      value: 3
      message: "Please select no more than 3 options."
```

---

## rating

Star or numeric rating. Default scale is 1–5.

```yaml
- id: satisfaction
  type: rating
  label: "How satisfied are you?"
  min_label: "Very unsatisfied"
  max_label: "Very satisfied"
  validators:
    - required
    - type: min
      value: 1
    - type: max
      value: 5
```

---

## file_upload

File upload field. Accepts any file type by default.

```yaml
- id: resume
  type: file_upload
  label: "Resume / CV"
  validators:
    - required
    - type: max
      value: 1
      message: "Please upload one file only."
```

---

## signature

Drawn signature field (renders a canvas for the user to sign with mouse or touch).

```yaml
- id: signature
  type: signature
  label: "Your signature"
  validators:
    - required
```

---

## address

Full address input. Returns a formatted or structured address.

```yaml
- id: home_address
  type: address
  label: "Home address"
  outputFormat: "structured"  # "string" (default) or "structured"
  validators:
    - required
```

Related address types for individual components:
- `address_locality` — city/town
- `address_region` — state/province
- `address_country` — country selector

---

## geolocation

Captures the respondent's GPS coordinates (requires browser permission).

```yaml
- id: location
  type: geolocation
  label: "Your current location"
  validators:
    - required
```

---

## camera

Takes a photo using the device camera.

```yaml
- id: photo
  type: camera
  label: "Take a photo"
  facing_mode: "front"  # "front" (selfie) or "rear" (default)
  validators:
    - required
```

---

## hidden

Hidden field — never shown to the user. Useful for passing metadata (e.g. referral source from URL query parameters).

```yaml
- id: source
  type: hidden
  label: "Source"
  # Prefill via ?source=google in the URL
```

---

## turnstile

Cloudflare Turnstile bot-protection challenge. Add this as the last field in a section to require humans to pass a challenge before submitting.

```yaml
- id: captcha
  type: turnstile
  label: "Please verify you are human"
```

---

## Validators — full reference

| Validator | Applies to | Description |
|-----------|-----------|-------------|
| `required` | All types | Field must have a value. |
| `type: min_length` | text | Minimum number of characters. |
| `type: max_length` | text | Maximum number of characters. |
| `type: min` | number, rating, multiple_select | Minimum value or minimum selections. |
| `type: max` | number, rating, file_upload, multiple_select | Maximum value, file count, or selections. |
| `type: pattern` | text, email | Regex that the value must match. |
| `type: expression` | All types | Custom JavaScript expression returning true/false. |

All validators except `required` support an optional `message` property to override the default error text.
