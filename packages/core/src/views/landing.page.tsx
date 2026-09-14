import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { mergeClassNames } from '@/lib/utils';

const GITHUB_URL = 'https://github.com/declarativeforms/core';
const GET_STARTED_URL = `${GITHUB_URL}#get-started`;
const FEATURE_REQUEST_URL =
  'https://frms.dev/declarativeforms/core/examples/feature-request';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&display=swap';

const HERO_YAML = `# forms/beta-access.yaml, committed to GitHub
version: 1
title: "Request beta access"

sections:
  - id: application
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
`;

const STEPS: Array<{ index: string; title: string; body: string }> = [
  {
    index: '01',
    title: 'Define your form',
    body: 'Start from an example and edit the YAML, or ask your coding agent to draft it using the published JSON Schema.',
  },
  {
    index: '02',
    title: 'Push it to GitHub',
    body: 'Commit the definition to a public GitHub repository. Keep its history and review changes through your existing pull request workflow.',
  },
  {
    index: '03',
    title: 'Open and share it',
    body: 'Open the matching path on frms.dev without .yaml. Use ?branch=draft to preview another pushed branch.',
  },
];

const URL_PARTS: Array<{ text: string; label: string | null }> = [
  { text: 'https://frms.dev/', label: null },
  { text: 'your-org', label: 'owner' },
  { text: '/', label: null },
  { text: 'your-repo', label: 'repo' },
  { text: '/', label: null },
  { text: 'forms/beta-access', label: 'file path' },
  { text: '?branch=draft', label: 'branch' },
];

const FOOTER_COLUMNS: Array<{
  title: string;
  links: Array<{ href: string; label: string }>;
}> = [
  {
    title: 'Product',
    links: [
      { href: `${GITHUB_URL}/blob/main/SCHEMA.md`, label: 'YAML reference' },
      { href: GITHUB_URL, label: 'Source' },
    ],
  },
  {
    title: 'Project',
    links: [
      { href: `${GITHUB_URL}/blob/main/LICENSE`, label: 'AGPL-3.0 licence' },
      { href: `${GITHUB_URL}/issues`, label: 'Issues' },
    ],
  },
];

type YamlToken = {
  text: string;
  tone: 'comment' | 'key' | 'value' | 'plain';
};

const YAML_TONE_CLASS: Record<string, string> = {
  comment: 'text-ink/40',
  key: 'text-brand-purple font-medium',
  value: 'text-ink',
  plain: 'text-ink-muted',
};

const YAML_KEY_PATTERN = /^(\s*(?:-\s*)?)([A-Za-z0-9_]+)(:)(.*)$/;

function tokenizeYamlLine(line: string): Array<YamlToken> {
  if (line.trim().startsWith('#')) {
    return [{ text: line, tone: 'comment' }];
  }

  const match = YAML_KEY_PATTERN.exec(line);

  if (match === null) {
    return [{ text: line, tone: 'plain' }];
  }

  const tokens: Array<YamlToken> = [
    { text: match[1], tone: 'plain' },
    { text: match[2], tone: 'key' },
    { text: match[3], tone: 'plain' },
  ];

  if (match[4].length > 0) {
    tokens.push({ text: match[4], tone: 'value' });
  }

  return tokens;
}

const BUTTON_VARIANT_CLASS: Record<string, string> = {
  primary: 'bg-brand-yellow',
  secondary: 'bg-white',
};

const BUTTON_SIZE_CLASS: Record<string, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

function ActionButton(props: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'lg';
}): React.JSX.Element {
  const variant = props.variant ?? 'primary';
  const size = props.size ?? 'md';

  return (
    <a
      className={mergeClassNames(
        'inline-flex items-center justify-center gap-2 rounded-md border-2 border-ink font-semibold text-ink shadow-hard transition-all duration-150',
        'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg',
        'active:translate-x-0 active:translate-y-0 active:shadow-hard',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        BUTTON_VARIANT_CLASS[variant],
        BUTTON_SIZE_CLASS[size],
      )}
      href={props.href}
      rel="noreferrer"
    >
      {props.children}
    </a>
  );
}

function BrandMark(): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        alt=""
        className="size-8 rounded-md border-2 border-ink"
        src="/android-chrome-192x192.png"
      />
      <span className="font-display text-lg font-semibold tracking-[-0.02em]">
        Declarative Forms
      </span>
    </span>
  );
}

function SiteNav(): React.JSX.Element {
  return (
    <header className="border-b-2 border-ink bg-paper">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-10 lg:px-16">
        <Link
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          href="/"
        >
          <BrandMark />
        </Link>
        <div className="flex items-center gap-6">
          <a
            className="hidden text-sm font-semibold text-ink underline-offset-4 hover:underline md:inline"
            href={GITHUB_URL}
            rel="noreferrer"
          >
            GitHub
          </a>
          <ActionButton href={GET_STARTED_URL}>
            Create your first form
          </ActionButton>
        </div>
      </nav>
    </header>
  );
}

function Hero(): React.JSX.Element {
  return (
    <section className="border-b-2 border-ink bg-paper-alt px-6 py-20 md:px-10 md:py-24 lg:px-16">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div className="flex flex-col items-start gap-7">
          <h1 className="-rotate-1 border-2 border-ink bg-brand-yellow px-3 py-1 text-sm font-semibold text-ink">
            Forms as Code
          </h1>
          <p className="font-display text-[2.5rem] leading-[1.1] font-semibold tracking-[-0.02em] text-balance sm:text-5xl lg:text-6xl">
            Live forms. Maintained in GitHub.
          </p>
          <p className="max-w-[46ch] text-lg leading-relaxed text-ink-muted">
            For engineers who own product and technical workflows. Define your
            form in YAML and commit it to GitHub. Declarative Forms renders the
            questions, validates answers, and stores submissions.
          </p>
          <ActionButton href={GET_STARTED_URL} size="lg">
            Create your first form
            <ArrowRight className="size-4" />
          </ActionButton>
        </div>
        <div className="overflow-hidden rounded-lg border-2 border-ink bg-white shadow-hard-lg rotate-[0.6deg]">
          <div className="flex items-center gap-2 border-b-2 border-ink bg-paper-alt px-4 py-2.5">
            <span className="size-2.5 rounded-full border-2 border-ink bg-brand-yellow" />
            <span className="font-mono text-xs font-medium text-ink-muted">
              beta-access.yaml
            </span>
          </div>
          <pre className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-6">
            <code>
              {HERO_YAML.replace(/\n$/, '')
                .split('\n')
                .map((line, lineIndex) => (
                  <span className="block" key={lineIndex}>
                    {tokenizeYamlLine(line).map((token, tokenIndex) => (
                      <span
                        className={YAML_TONE_CLASS[token.tone]}
                        key={tokenIndex}
                      >
                        {token.text}
                      </span>
                    ))}
                    {line.length === 0 ? ' ' : null}
                  </span>
                ))}
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}

function HowItWorks(): React.JSX.Element {
  return (
    <section className="bg-paper px-6 py-20 md:px-10 md:py-24 lg:px-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-3xl leading-[1.15] font-semibold tracking-[-0.02em] text-balance sm:text-4xl lg:text-[2.5rem]">
            From a repository file to a working form.
          </h2>
          <p className="max-w-[52ch] text-base leading-relaxed text-ink-muted">
            Keep the form definition beside the system it supports. Review
            changes in pull requests and preview a pushed branch before merging.
          </p>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <li
              className="flex flex-col gap-3 rounded-lg border-2 border-ink bg-white p-6 shadow-hard"
              key={step.index}
            >
              <span className="font-display text-3xl font-semibold text-brand-purple">
                {step.index}
              </span>
              <h3 className="font-display text-xl font-semibold tracking-[-0.02em]">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-8 overflow-x-auto rounded-lg border-2 border-ink bg-brand-purple-soft p-6 shadow-hard">
          <div className="flex min-w-max items-start font-mono text-sm">
            {URL_PARTS.map((part) => (
              <span className="flex flex-col items-center" key={part.text}>
                <span
                  className={
                    part.label === null
                      ? 'px-0.5 py-1 text-ink-muted'
                      : 'rounded-sm border-2 border-ink bg-white px-2 py-1 font-medium text-ink'
                  }
                >
                  {part.text}
                </span>
                <span className="mt-2 text-[11px] tracking-wide text-ink-muted uppercase">
                  {part.label ?? ''}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Tradeoff(): React.JSX.Element {
  return (
    <section className="border-y-2 border-ink bg-brand-purple px-6 py-20 text-white md:px-10 md:py-24 lg:px-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex max-w-[58ch] flex-col gap-6">
          <span className="inline-block w-fit -rotate-1 border-2 border-ink bg-brand-yellow px-3 py-1 text-sm font-semibold text-ink">
            Your definition. Declarative Forms handles the rest.
          </span>
          <h2 className="font-display text-3xl leading-[1.15] font-semibold tracking-[-0.02em] text-balance sm:text-4xl lg:text-[2.5rem]">
            Ship the form without building its backend.
          </h2>
          <p className="text-lg leading-relaxed text-white/85">
            Define multiple steps, conditional questions, validation rules, and
            file uploads in one YAML file. Declarative Forms turns it into a
            form people can complete.
          </p>
          <p className="text-lg leading-relaxed text-white/85">
            Declarative Forms stores submissions. Add email or webhook
            connections to send responses into your workflow, and customize the
            completion screen to tell respondents what happens next.
          </p>
        </div>
      </div>
    </section>
  );
}

function FeatureRequests(): React.JSX.Element {
  return (
    <section
      className="bg-paper-alt px-6 py-20 md:px-10 md:py-24 lg:px-16"
      id="feature-requests"
    >
      <div className="mx-auto grid w-full max-w-6xl items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <h2 className="font-display text-3xl leading-[1.15] font-semibold tracking-[-0.02em] text-balance sm:text-4xl lg:text-[2.5rem]">
            Need something for your workflow?
          </h2>
          <p className="max-w-[46ch] text-lg leading-relaxed text-ink-muted">
            Describe the feature and what it would help you do. If we accept
            your request, we’ll build it within 72 hours.
          </p>
          <p className="max-w-[52ch] text-sm leading-relaxed text-ink-muted">
            We’ll confirm acceptance and scope by email. The 72-hour window
            starts when we accept.
          </p>
          <p className="max-w-[52ch] text-sm leading-relaxed text-ink-muted">
            Try the form here. Its YAML definition lives in this repository,
            with an email connection configured to send requests to our inbox.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
            <a
              className="underline underline-offset-4 hover:text-brand-purple"
              href={FEATURE_REQUEST_URL}
              target="_blank"
              rel="noreferrer"
            >
              Open the request form
            </a>
            <a
              className="underline underline-offset-4 hover:text-brand-purple"
              href={`${GITHUB_URL}/blob/main/examples/feature-request.yaml`}
              target="_blank"
              rel="noreferrer"
            >
              View its YAML definition
            </a>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border-2 border-ink bg-white shadow-hard-lg">
          <iframe
            className="h-[680px] w-full border-0 sm:h-[620px]"
            loading="lazy"
            src={`${FEATURE_REQUEST_URL}?embed=true&step=request`}
            title="Request a feature in Declarative Forms"
          />
        </div>
      </div>
    </section>
  );
}

function FinalCta(): React.JSX.Element {
  return (
    <section className="border-t-4 border-ink bg-brand-yellow-soft px-6 py-20 md:px-10 md:py-24 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-7 text-center">
        <h2 className="font-display text-3xl leading-[1.15] font-semibold tracking-[-0.02em] text-balance sm:text-4xl lg:text-[2.5rem]">
          Put your next form in GitHub.
        </h2>
        <p className="max-w-[48ch] text-lg leading-relaxed text-ink-muted">
          Start with an example, push your YAML, and open the form on frms.dev.
          Keep future changes in the same review workflow as your code.
        </p>
        <ActionButton href={GET_STARTED_URL} size="lg">
          Create your first form
          <ArrowRight className="size-4" />
        </ActionButton>
      </div>
    </section>
  );
}

function SiteFooter(): React.JSX.Element {
  return (
    <footer className="border-t-2 border-ink bg-paper px-6 py-14 md:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <BrandMark />
            <p className="max-w-[32ch] text-sm leading-relaxed text-ink-muted">
              Forms as Code for engineering workflows.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div className="flex flex-col gap-3" key={column.title}>
              <h3 className="text-xs font-semibold tracking-wide text-ink uppercase">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <a
                      className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                      href={link.href}
                      rel="noreferrer"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t-2 border-ink pt-6 text-xs text-ink-muted">
          Open source under the GNU Affero General Public License v3.0.
        </p>
      </div>
    </footer>
  );
}

export function LandingPage(): React.JSX.Element {
  return (
    <div className="flex min-h-lvh flex-col bg-paper">
      <link href={FONT_HREF} rel="stylesheet" />
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Tradeoff />
        <FeatureRequests />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
