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

The hosted instance at [frms.dev](https://frms.dev) reads `.yaml` form files
from public GitHub repositories.

### Use Codex or Claude Code

Open the repository where you want the form to live in Codex or Claude Code,
then paste this prompt:

```text
Read https://frms.dev/AGENTS.md, then create forms/beta-access.yaml in this
repository. It should collect a required email address and a required
description of what the applicant is building. Add a clear completion message
and validate the form against https://frms.dev/schema.json.

Do not commit or push. When finished, report the form path and its frms.dev URL.
```

The agent will use the published authoring rules, create the YAML in your
repository, and validate it. Review the diff, then commit the form when you are
happy with it.

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

The schema modeline gives compatible editors inline validation and completion.

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

- [AGENTS.md](https://frms.dev/AGENTS.md) contains the complete form-authoring
  workflow and runtime rules for coding agents.
- [schema.json](https://frms.dev/schema.json) is the authoritative,
  machine-readable schema.
- [SCHEMA.md](./SCHEMA.md) is the human-readable reference for every field,
  validator, condition, and connection.
- [`contact.yaml`](./contact.yaml) is a compact example;
  [`kitchen-sink.yaml`](./kitchen-sink.yaml) demonstrates the full feature set.

Forms can include multiple sections, conditional logic, file uploads,
localization, templated completion screens, email connections, and webhooks.

## Project

Declarative Forms is open source under the [AGPL-3.0 license](./LICENSE) and can
be self-hosted.
