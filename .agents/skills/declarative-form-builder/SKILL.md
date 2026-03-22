---
name: declarative-form-builder
description: Use when a user wants to create, design, or generate a YAML form using Declarative Forms / frms.dev. Reach for this skill when someone describes a form they need — a contact form, survey, job application, booking form, registration, feedback form, or any other data-collection form — and wants the result as a YAML file they can use with frms.dev or a self-hosted Declarative Forms instance. Also use when a user wants to add fields, sections, conditional logic, or integrations (email, webhook) to an existing form.
---

# Declarative Form Builder

## When to use this skill

Use this skill whenever a user:

- Asks to **create a form** of any kind (contact, survey, registration, application, booking, feedback, etc.)
- Describes **what information they want to collect** from people
- Wants to generate, write, or update a **YAML file** for Declarative Forms / frms.dev
- Asks how to add fields, sections, conditional logic, or connections to a form

## How to build a form from a user description

Follow these steps every time. Do **not** generate YAML until you have gathered enough information.

### Step 1 — Understand what the user needs

When the user gives you a description, identify what you know and what is still missing. You need at least:

1. **Purpose** — What is the form for? (e.g. contact form, job application, event sign-up)
2. **Fields** — What information should respondents fill in?
3. **Destination** — Where should submissions go? (email address, webhook URL, or nothing)

If any of these three things is missing or unclear, ask before generating YAML. Keep your questions short and friendly — non-technical users do not need to know about YAML or field types.

**Examples of what to ask:**

- "What information do you want to collect from people filling in this form?"
- "Where should the responses be sent — is there an email address you'd like to use?"
- "Should the form have multiple steps, or is one page fine?"
- "Are there any fields that should only appear based on a previous answer?"

Ask all your missing questions in a **single message**. Do not ask one question at a time.

### Step 2 — Map the user's needs to form structure

Once you understand the requirements, mentally map them to Declarative Forms concepts:

| User says | What it means |
|-----------|--------------|
| "A text box for their name" | `short_text` field |
| "Their email address" | `email` field |
| "A dropdown / multiple choice" | `single_select` or `dropdown` field |
| "Pick several options" | `multiple_select` field |
| "Upload a file / CV / document" | `file_upload` field |
| "A rating or star rating" | `rating` field |
| "Their phone number" | `mobile_number` field |
| "A long message / description" | `long_text` field |
| "A date" | `date` field |
| "Show this only if…" | `visible_when` expression |
| "Different pages / steps" | multiple `sections` with `next` |
| "Send results to my email" | `email` connection |
| "Send to a webhook / Zapier / Make" | `webhook` connection |
| "Only allow work email addresses" | `block_free_email: true` on email field |
| "Verify their email with a code" | `otp: true` on email field |

### Step 3 — Generate the YAML

When you have enough information, produce a complete, valid YAML form. Follow these rules:

- Always start with `version: 1`.
- Give the form a clear `title` and `description` that match what the user described.
- Use short, descriptive `id` values (snake_case, no spaces).
- Every section must have a `next` — use `next: done` for the last section.
- Add `validators: [required]` to every field the user said is mandatory (default to required for all fields unless the user says otherwise).
- Use `placeholder` text to give respondents a helpful hint.
- Put the `connections` block at the **top level** (not inside a section).
- Only add fields, sections, and connections the user actually needs — do not pad the form.

### Step 4 — Explain what you built

After the YAML, write 2–3 short sentences describing:
- What the form does
- What the user should change (e.g. replace `hello@example.com` with their actual email)
- How to use it (push to GitHub, open via `https://frms.dev/<owner>/<repo>/<filename>`)

If the user is not technical, keep this explanation plain — no jargon.

## Field types — quick guide

See `references/field-types.md` for the complete reference. The most common types:

| Type | Use for |
|------|---------|
| `short_text` | Names, single-line answers |
| `long_text` | Messages, descriptions, open feedback |
| `email` | Email addresses |
| `mobile_number` | Phone numbers |
| `number` | Quantities, ages, amounts |
| `date` | Dates (day/month/year) |
| `single_select` | Pick one option from a list |
| `multiple_select` | Pick several options |
| `dropdown` | Pick one from a long list (with optional search) |
| `rating` | 1–5 star or numerical rating |
| `file_upload` | Resume, photo, document |
| `url` | Website or profile link |
| `signature` | Drawn signature |
| `hidden` | Hidden value (e.g. referral source from URL) |

## Connections — quick guide

| Type | Use when |
|------|----------|
| `email` | Send submission to an inbox |
| `webhook` | Send to Zapier, Make, n8n, or a custom endpoint |
| `airtable` | Write rows directly into an Airtable base |

## Conditional logic — quick guide

**Show/hide a field:** Add `visible_when` to the field using a JavaScript expression.

```yaml
visible_when: "data.inquiry_type === 'Business'"
```

**Branch between sections:** Use a `next` array with `when` / `else` rules.

```yaml
next:
  - when: "data.rating <= 2"
    go: "follow_up"
  - else: "done"
```

## Gotchas

- **YAML uses spaces, not tabs.** Indentation matters. Always use 2 spaces per level.
- **Quote strings that contain colons or special characters.** Use double quotes: `title: "Contact: us"`.
- **`connections` must be at the top level,** not inside a section.
- **Every section must have a `next`.** The last section uses `next: done`.
- **Field `id` values must be unique** across the entire form.
- **`visible_when` and `when` expressions are JavaScript.** Use `===` for equality, `&&` for AND, `||` for OR.
- **`options` lists under `single_select`, `multiple_select`, and `dropdown`** can be plain strings `- "Option"` or objects `- label: "Option" / value: "option_value"`.
- **`email` connection `to` must be a plain string,** not a template — you cannot use `{{data.email}}` as the `to` address.
- **`include_responses: true`** on an email connection attaches all submitted field values to the email.

## Incomplete descriptions — what to do

If the user's description is vague or missing key details:

1. Summarise what you understood.
2. List the specific things you still need.
3. Ask your questions in a single message.
4. Wait for the user's answer before generating YAML.

**Example response for an incomplete request:**

> "Happy to build that for you! I just need a couple of details:
> 1. What fields should the form include? (e.g. name, email, message, or something else?)
> 2. Where should the submissions go — is there an email address you'd like them sent to?"

## References

Load these files when you need the full specification:

- **`references/field-types.md`** — Every field type with all supported properties and validators.
- **`references/form-structure.md`** — Full form schema, connections, completion, theming, localization, and sections.
- **`assets/example-form.yaml`** — An annotated working example to use as a starting point or reference.
