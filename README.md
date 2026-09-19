# Declarative Forms

**Open-source Forms as Code.**

Define your form in YAML and keep it in GitHub. Declarative Forms turns that
definition into the working form—rendering questions, validating answers, and
storing submissions.

Edit it yourself or with an AI agent. The source stays readable, versioned, and
under your control. Use the hosted service on frms.dev or self-host the
open-source stack.

## Why keep forms in Git?

When a form supports a system your team owns, its definition can follow the
same lifecycle as that system:

- **Reviewable definitions.** Keep the YAML beside your code, review changes in
  pull requests, and use Git history to inspect or revert them.
- **A working form without a custom backend.** Declarative Forms provides
  the renderer, answer validation, and submission storage.
- **Responses that fit your workflow.** Configure email or webhook connections
  to deliver submissions, and a completion screen to explain the next step.

## How it works

The YAML form definition describes fields, sections, navigation, validation,
and optional completion screens and connections. Declarative Forms reads the
definition from GitHub and renders the form. As a respondent completes
sections, it saves partial submissions; final submission validates the answers
and marks the submission completed. Configured connections queue email or
webhook delivery.

The definition lives in GitHub. Submissions are stored by Declarative Forms,
not committed to your repository. Email and webhook delivery require
configured connections; the starter [`contact.yaml`](./examples/contact.yaml)
stores submissions but has no delivery connection. See
[Connections](./SCHEMA.md#connections) to add one, or inspect the email
connection in [`feature-request.yaml`](./examples/feature-request.yaml).

## Get Started

### Create manually

1. Copy [`contact.yaml`](./examples/contact.yaml) into your public GitHub
   repository as `forms/contact.yaml`. Use [`SCHEMA.md`](./SCHEMA.md) as the
   reference when changing fields, validation, or navigation.
2. Review, commit, and push the file, then open its repository path on
   [frms.dev](https://frms.dev) without the `.yaml` extension:

   ```text
   https://frms.dev/your-org/your-repo/forms/contact
   ```

Hosted forms use the literal `main` branch by default. For another pushed branch,
append `?branch=my-form` to the URL. Walk the form and check its completion
screen and any configured delivery before sharing it. Branch previews are live
forms: they can store submissions and trigger configured connections. They are
not isolated test environments.

### Use your coding agent

Open your repository in your preferred coding agent and paste:

```text
Use Declarative Forms. Read https://frms.dev/schema.json and create
forms/lunch-rsvp.yaml for a team lunch RSVP. If you cannot edit files, return
complete YAML. Validate against the schema if tooling is available and report
any checks you could not run. Do not commit or push.
```

Review the result, then publish it using the steps above. If your agent cannot
fetch the schema, provide its contents rather than asking it to guess the format.

## Go further

- [JSON Schema](https://frms.dev/schema.json) provides the maintained draft-07
  authoring contract for editors, validators, and coding agents.
- [SCHEMA.md](./SCHEMA.md) is the human-readable reference for every field,
  validator, condition, and connection.
- [`contact.yaml`](./examples/contact.yaml) is a compact example;
  [`calculator.yaml`](./examples/calculator.yaml) demonstrates derived estimates;
  [`kitchen-sink.yaml`](./examples/kitchen-sink.yaml) demonstrates the full
  feature set.

Forms can include multiple sections, conditional logic, file uploads,
localization, templated completion screens, email connections, and webhooks.

## Project

Declarative Forms is open source under the [AGPL-3.0 license](./LICENSE) and can
be self-hosted. The repository includes
[Docker Compose configuration](./compose.yaml) for the web app, API, scheduler,
MongoDB, and S3-compatible object storage.
Self-hosted deployments can configure `GITHUB_DEFAULT_BRANCH` and use
`GITHUB_TOKEN` to read repositories the token can access. A private repository
does not make a form definition private: people loading the form can see its
configuration. Keep secrets out of YAML.
