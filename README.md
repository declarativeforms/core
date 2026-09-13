# Declarative Forms

**Forms as Code for GitHub-native teams.**

Define a form in YAML, keep it in GitHub, and turn it into a live, hosted form.
The definition stays in your repository, so every change is versioned,
reviewable, and portable. Declarative Forms handles the form experience without
moving its source of truth into another dashboard.

## Why keep forms in Git?

Some forms are part of a product, engineering workflow, open-source project, or
technical process. Those forms benefit from living beside the systems they
support:

- **One source of truth.** The form is a file your team owns.
- **Your existing workflow.** Review changes in pull requests, preview a branch,
  and revert when needed.
- **Less infrastructure to build.** Declarative Forms handles rendering,
  validation, and submissions from the definition you commit.

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

Forms use the literal `main` branch by default. For another pushed branch,
append `?branch=my-form` to the URL. Walk the form and check its completion
screen and any configured delivery before sharing it.

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
be self-hosted.
