# Declarative Forms

**A live form from a file you own.**

Declarative Forms is an open-source Forms-as-Code platform. Describe your form
in YAML, keep the definition in GitHub, and let Declarative Forms turn it into
a working form—with rendering, validation, and submission handling.

Edit the definition yourself or with an AI agent. Use the hosted service at
[frms.dev](https://frms.dev), or run the platform on your own infrastructure.

**[Get started](#get-started)** ·
[Live example](https://frms.dev/declarativeforms/core/examples/contact) ·
[Form reference](./SCHEMA.md) ·
[Self-hosting](#self-hosting)

## Keep the definition. Skip building the form system.

A form should fit into your workflow—not require a separate application
to build and maintain.

**Keep changes visible.** Questions, rules, and connections live in a readable
file. Use Git to track changes, compare versions, and review updates.

**Work with your tools.** Edit a definition directly, adapt an example, generate
it with a script, or ask an AI agent to help. The underlying artifact stays
the same.

**Let Declarative Forms run it.** The platform renders the form, validates
answers, and stores submissions. Configure connections to send responses into
the systems you already use.

This approach is for people who build and maintain workflows—not only people
who write application code.

**The definition lives in GitHub. Submissions are stored separately by the
Declarative Forms deployment.**

## Get Started

Start with the [contact form example](./examples/contact.yaml), or describe
your own form:

```yaml
title: "Tell us about your project"

sections:
  - id: request
    title: "Your project"
    fields:
      - id: project
        type: long_text
        label: "What are you working on?"
        validators: [required]
    next: done
```

The definition describes what to ask and how the form should behave.
Declarative Forms provides the working experience.

Explore the [examples](./examples/) for complete definitions and compare the
[live contact form](https://frms.dev/declarativeforms/core/examples/contact)
with [its YAML](./examples/contact.yaml) to see the model in action.

### Write the form, not the application

The [form reference](./SCHEMA.md) explains fields, multi-step flows, conditional
logic, validation, completion screens, and connections.

Compatible editors and AI agents can use the
[published JSON Schema](https://frms.dev/schema.json) to help create and check
definitions. Review generated definitions and test the resulting form before
sharing it.

Form definitions are visible to people loading the form. Keep secrets and
credentials out of the YAML.

## Self-hosting

Use [frms.dev](https://frms.dev) to publish forms without operating the platform.
Self-host when you need control over the application and its infrastructure.

The [deployment configuration](./compose.yaml) and
[configuration reference](./.env.example) describe the current setup.
Self-hosting means taking responsibility for operating, updating, and backing
up your deployment.

The model stays the same: definitions in GitHub, working forms served by
Declarative Forms, and submissions stored separately.

## Feedback

Found a bug, have a question, or need something for your workflow?
[Open an issue](https://github.com/declarativeforms/core/issues).

You can also use our
[feature-request form](https://frms.dev/declarativeforms/core/examples/feature-request)
and inspect [the definition behind it](./examples/feature-request.yaml).

## License

Open source under the
[GNU Affero General Public License v3.0](./LICENSE).