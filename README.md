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

## Create your first form

Start with the [YAML guide](https://frms.dev/docs).

The hosted instance at [frms.dev](https://frms.dev) reads `.yaml` form files
from public GitHub repositories.

### Use your coding agent

Open the repository where the form should live in your preferred coding agent,
then paste a request that links to the ordinary documentation:

```text
Read https://frms.dev/docs and https://frms.dev/schema.json. Create an RSVP form
for a team lunch at forms/lunch-rsvp.yaml in this repository. Collect name,
email, attendance, and optional dietary requirements. Include a completion
message. If you cannot edit files, return the complete YAML. Validate against
the schema using available tooling, and report any checks you could not run.
Report the expected Declarative Forms URL if the GitHub repository is known.
Do not commit or push.
```

Review the YAML diff, then commit and push when ready. The guide covers the
same format for human authors and coding agents. If your agent cannot access
the documentation, paste the relevant reference and example into its context.

### Or create it manually

Add `forms/beta-access.yaml` to a public GitHub repository:

```yaml
# yaml-language-server: $schema=https://frms.dev/schema.json
version: 1
title: "Request beta access"

sections:
  - id: application
    title: "Tell us what you're building"
    fields:
      - id: email
        type: email
        label: "Email address"
        validators: [required]

      - id: project
        type: long_text
        label: "What are you building?"
        validators: [required]

    next: done

completion:
  title: "Request received"
  message: "Thanks. We'll be in touch."
```

The schema comment enables completion and validation in compatible YAML editors.
See the [YAML reference](./SCHEMA.md) for explanations and examples.

### Open the live form

Commit the file, then open its repository path on `frms.dev` without the
`.yaml` extension:

```text
https://frms.dev/your-org/your-repo/forms/beta-access
```

Forms resolve from the literal `main` branch by default. Preview another branch
before merging with:

```text
https://frms.dev/your-org/your-repo/forms/beta-access?branch=my-form
```

## Go further

- [Documentation](https://frms.dev/docs) explains YAML authoring, the optional
  coding-agent workflow, publishing, and preview checks.
- [JSON Schema](https://frms.dev/schema.json) provides the maintained draft-07
  authoring contract for editors, validators, and coding agents.
- [Discovery index](https://frms.dev/llms.txt) links the shared references and examples.
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
