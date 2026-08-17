# Intent-to-form design guide

Use this reference when creating a new form, substantially redesigning one, or
turning an underspecified objective into concrete questions.

## Start from the outcome

Identify:

1. Who completes the form.
2. What decision or action the answers should enable.
3. Which answers are indispensable for that outcome.
4. What the respondent should see or do after submission.
5. Whether answers need delivery through an existing email or webhook.

Infer ordinary presentation details. Ask a question only when the answer would
materially change data collection, branching, privacy, or delivery. Never
invent a recipient, endpoint, consent statement, legal requirement, or secret.

## Choose fields deliberately

- Use semantic types (`email`, `url`, `date`, `rating`) instead of generic text.
- Use `single_select` for a short visible list and `dropdown` for a long list.
- Make a dropdown searchable when respondents would otherwise scan many items.
- Use `multiple_select` only when more than one answer is meaningful.
- Add `allow_other` when the options are intentionally non-exhaustive.
- Use `long_text` for reflection or explanation, not one-line facts.
- Use `number` only for whole non-negative quantities.
- Use `hidden` only for known contextual values that will be prefilled.
- Request files, camera, signature, address, or geolocation only when the
  outcome truly requires that higher-friction or sensitive data.

## Control effort and bias

- Collect the minimum data needed.
- Mark a field required only when the user cannot act without it.
- Put identifying and sensitive questions after the form has established its
  purpose, unless identity is the entire purpose.
- Write neutral labels and balanced options. Do not imply a preferred answer.
- Use placeholders for examples, not essential instructions.
- Keep labels concise and validation messages actionable.
- Prefer a small number of coherent sections over a long, arbitrary wizard.

## Common patterns

| Objective          | Usually include                                                | Consider                                                             |
| ------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------- |
| Contact or support | Name, reply email, topic, message                              | Conditional details by topic; email/webhook only if supplied         |
| Feedback or survey | Overall rating, focused choice questions, optional explanation | Keep identity optional; branch to follow-up on low scores            |
| Event registration | Name, email, attendance/ticket choice                          | Dietary/accessibility needs, conditional attendee details            |
| Application        | Identity/contact, qualification questions, motivation          | Multiple sections, document upload, explicit completion expectations |
| Lead qualification | Contact, organization, need, timing                            | Conditional organization section; avoid excessive profiling          |
| Intake or request  | Request type, necessary context, urgency, contact              | Branch by request type; confirmation with next steps                 |

These are starting points, not mandatory templates. Remove questions that do
not serve the user's stated objective.

## Design branching

Use `visible_when` for a small follow-up on the same page. Use conditional
`next` for a meaningfully different respondent journey. Always include a
fallback and ensure every target exists. Avoid cycles.

Prefer stored option values designed for logic:

```yaml
options:
  - label: "Yes, contact me"
    value: "yes"
  - label: "No"
    value: "no"
```

Then compare the stored value:

```yaml
visible_when: "data.follow_up === 'yes'"
```

## Update without breaking history

Treat field IDs and option values as data contracts.

- Preserve existing field and section IDs unless renaming is explicitly part
  of the request.
- Preserve option values when changing display labels.
- Search all expressions, templates, navigation, and connections before
  removing or renaming an ID.
- Preserve connections, localization, analytics, theme, dates, and comments
  unless the user asks to change them.
- Prefer a focused patch over regenerating the whole file.
- If removing a question, explain that future submissions will no longer
  include it; do not attempt to rewrite historical submissions.

## Finish with respondent-facing copy

The title and description should state the purpose and set expectations. The
completion screen should confirm receipt and explain the next step without
promising an unsupported response time. Use answer templating only when it
makes the message clearer and the referenced answer is guaranteed to exist.
