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

### Field Types

- [Basic](https://github.com/declarativeforms/examples/blob/main/basic.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/basic))
- [Dropdown](https://github.com/declarativeforms/examples/blob/main/dropdown.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/dropdown))
- [Email](https://github.com/declarativeforms/examples/blob/main/email.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/email))
- [Long Text](https://github.com/declarativeforms/examples/blob/main/long_text.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/long_text))
- [Multiple Select](https://github.com/declarativeforms/examples/blob/main/multiple_select.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/multiple_select))
- [Short Text](https://github.com/declarativeforms/examples/blob/main/short_text.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/short_text))
- [Single Select](https://github.com/declarativeforms/examples/blob/main/single_select.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/single_select))

### Other

- [Visible When](https://github.com/declarativeforms/examples/blob/main/visible_when.yaml.yaml) ([Demo](https://app.declarativeforms.com/declarativeforms/examples/visible_when.yaml))

## Feedback & Feature Requests

Have an idea for a new feature or found something that could be improved? We'd love to hear from you.

You can submit and vote on feature requests here: [Submit a Feature Request](https://declarative-forms.canny.io)
