import Link from 'next/link';
import { AuthoringPrompt } from './authoring-prompt';

const REPOSITORY_URL = 'https://github.com/declarativeforms/core';

export function DocumentationPage(): React.JSX.Element {
  return (
    <main className="mx-auto max-w-3xl space-y-12 px-5 py-10 text-neutral-800 sm:py-16 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_p]:leading-relaxed">
      <header className="space-y-5">
        <Link href="/" className="text-sm font-semibold">
          Declarative Forms / Forms as Code
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Your first form lives in your repo.
        </h1>
        <p className="text-lg text-neutral-600">
          Define a form in YAML, review it with your code, and let Declarative
          Forms handle rendering and submissions. Write the file yourself or use
          your coding agent.
        </p>
        <nav
          aria-label="Documentation"
          className="flex flex-wrap gap-5 text-sm"
        >
          <a href="#create-from-yaml">Create from YAML</a>
          <a href="#coding-agent">Use your coding agent</a>
          <a href={`${REPOSITORY_URL}/blob/main/SCHEMA.md`}>YAML reference</a>
          <a href="/schema.json">JSON Schema</a>
        </nav>
      </header>

      <section id="create-from-yaml" className="space-y-5 scroll-mt-8">
        <h2>1. Create a YAML file</h2>
        <p>
          Add <code>forms/beta-access.yaml</code> to your repository. The hosted
          service reads <code>.yaml</code> files from public GitHub
          repositories.
        </p>
        <pre className="overflow-x-auto rounded-xl bg-neutral-900 p-5 text-sm leading-relaxed text-neutral-100">
          <code>{`# yaml-language-server: $schema=https://frms.dev/schema.json
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
  message: "Thanks for your interest."
`}</code>
        </pre>
        <p>
          See the{' '}
          <a href={`${REPOSITORY_URL}/blob/main/SCHEMA.md`}>
            complete YAML reference
          </a>{' '}
          for field types, validation, conditional navigation, and email or
          webhook delivery. A form can collect submissions without a connection;
          configure a real recipient or endpoint when you need delivery.
        </p>
        <p>
          The schema comment gives compatible YAML editors completion and
          validation using the <a href="/schema.json">JSON Schema</a>. The
          readable reference explains the format with examples; the schema
          provides a machine-readable contract for editors and coding agents.
        </p>
      </section>

      <section className="space-y-5">
        <h2>2. Review, push, and open</h2>
        <p>
          Review the YAML, then commit and push it to GitHub. Replace the owner
          and repository below with your own; omit the file&apos;s{' '}
          <code>.yaml</code> extension.
        </p>
        <pre className="overflow-x-auto rounded-xl border border-neutral-200 bg-white p-5 text-sm">
          <code>https://frms.dev/your-org/your-repo/forms/beta-access</code>
        </pre>
        <p>
          The default branch is literally <code>main</code>, even if your
          repository uses a different default. To preview a pushed branch before
          merging, append its URL-encoded name:
        </p>
        <pre className="overflow-x-auto rounded-xl border border-neutral-200 bg-white p-5 text-sm">
          <code>
            https://frms.dev/your-org/your-repo/forms/beta-access?branch=feature%2Fbeta-access
          </code>
        </pre>
        <p>
          A local file is not live until it is pushed to a repository the
          Declarative Forms deployment can read. Private or non-GitHub
          repositories can hold your YAML, but the public service cannot render
          it from there. A self-hosted deployment can use a read-only GitHub
          token for selected private repositories.
        </p>
      </section>

      <section id="coding-agent" className="space-y-5 scroll-mt-8">
        <h2>Use your coding agent</h2>
        <p>
          Open your repository in your preferred coding agent and paste this
          prompt. Change the form request to fit your workflow.
        </p>
        <AuthoringPrompt />
        <p>
          Linking directly to this guide gives the agent a starting point. A
          shorter request such as “Use frms.dev to create an RSVP form for a
          lunch event” depends on the agent finding the documentation.
        </p>
        <p>
          Agents can also start with the <a href="/llms.txt">discovery index</a>
          , which links to the same guide, schema, and examples. It is an
          optional starting point; direct links in your prompt avoid relying on
          automatic discovery.
        </p>
        <ul className="list-disc space-y-3 pl-5">
          <li>
            Follow the repository&apos;s existing instructions and file
            conventions. Use <code>forms/</code> when no convention exists.
            Create or edit the YAML directly; no Declarative Forms package or
            frontend code is needed.
          </li>
          <li>
            Use the <a href="/schema.json">JSON Schema</a> for supported keys,
            constraints, descriptions, and examples, and the{' '}
            <a href="https://raw.githubusercontent.com/declarativeforms/core/main/SCHEMA.md">
              readable reference
            </a>{' '}
            for runtime guidance. If network access is unavailable, ask the user
            to paste the relevant reference and an example instead of guessing
            the format.
          </li>
          <li>
            Use only supported fields and validators. Keep field IDs unique, use{' '}
            <code>snake_case</code>, and check section targets and expressions.
          </li>
          <li>
            Keep secrets out of YAML. Only add delivery connections to
            destinations supplied by the user. Ask for missing details that
            affect the requested behavior.
          </li>
          <li>
            If file editing is unavailable, return a complete YAML code block
            with a suggested filename. If the GitHub remote is unknown, report
            the URL template and the missing owner/repository rather than
            inventing them.
          </li>
          <li>
            Report the file path, assumptions, checks performed, and expected
            URL. Explain that the file still needs to be pushed. Leave
            committing and pushing to the user unless they explicitly request
            them.
          </li>
        </ul>
      </section>

      <section className="space-y-5">
        <h2>3. Check the respondent experience</h2>
        <p>
          Validate the parsed YAML against the{' '}
          <a href="/schema.json">JSON Schema</a> using an available validator.
          The maintained schema rejects unsupported keys and field types.
          Parsing YAML alone does not validate the form definition, and
          unsupported properties can be ignored during rendering.
        </p>
        <p>
          If you already have <code>check-jsonschema</code>, run the command
          below. You can optionally install it with{' '}
          <code>pipx install check-jsonschema</code> outside your repository, or
          use an existing validator that supports JSON Schema draft-07 and
          parses YAML input. No Declarative Forms package is required.
        </p>
        <pre className="overflow-x-auto rounded-xl border border-neutral-200 bg-white p-5 text-sm">
          <code>
            check-jsonschema --schemafile https://frms.dev/schema.json
            forms/beta-access.yaml
          </code>
        </pre>
        <p>
          Open the pushed form and walk every navigation branch. Check required
          fields, choices, completion text, and any configured delivery. A
          successful schema check does not execute expressions, verify
          navigation targets or cycles, or test delivery. State explicitly when
          validation tooling, a live preview, or a delivery test is unavailable.
        </p>
        <p>
          For working examples, start with{' '}
          <a href={`${REPOSITORY_URL}/blob/main/examples/contact.yaml`}>
            contact
          </a>
          ,{' '}
          <a href={`${REPOSITORY_URL}/blob/main/examples/lunch-rsvp.yaml`}>
            team lunch RSVP
          </a>
          , or the{' '}
          <a href={`${REPOSITORY_URL}/blob/main/examples/fields/README.md`}>
            field examples
          </a>
          .
        </p>
      </section>
      <footer className="border-t border-neutral-200 pt-6 text-sm text-neutral-600">
        <Link href="/">Declarative Forms</Link> ·{' '}
        <a href={REPOSITORY_URL}>Source on GitHub</a>
      </footer>
    </main>
  );
}
