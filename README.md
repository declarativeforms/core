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
- [Single Select](https://github.com/declarativeforms/examples/blob/main/single_select.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/single_select))
- [Multiple Select](https://github.com/declarativeforms/examples/blob/main/multiple_select.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/multiple_select))
- [Rating](https://github.com/declarativeforms/examples/blob/main/rating.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/rating))

#### Advanced

- [Address](https://github.com/declarativeforms/examples/blob/main/address.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/address))
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
- [Mixpanel](https://github.com/declarativeforms/examples/blob/main/mixpanel.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/mixpanel))

## Feedback & Feature Requests

Have an idea for a new feature or found something that could be improved? We'd love to hear from you.

You can submit and vote on feature requests here: [Submit a Feature Request](https://declarative-forms.canny.io)
