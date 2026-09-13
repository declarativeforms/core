import type { ReactNode } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { mergeClassNames } from '@/lib/utils';

const GITHUB_URL = 'https://github.com/declarativeforms/core';
const PLUGIN_URL = `${GITHUB_URL}/tree/main/plugins/declarative-forms`;
const QUICK_START_URL = `${GITHUB_URL}#create-your-first-form`;
const FEATURE_REQUEST_URL =
  'https://frms.dev/declarativeforms/core/examples/feature-request';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&display=swap';

const HERO_TICKS: Array<string> = [
  'Versioned in Git',
  'Reviewable by pull request',
  'Portable by design',
];

const HERO_YAML = `# beta-access.yaml, committed to your repo
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
    title: 'Define the form',
    body: 'Write the YAML yourself, or ask your AI client to create it through the Declarative Forms MCP server.',
  },
  {
    index: '02',
    title: 'Review it in GitHub',
    body: 'Commit the YAML to a public GitHub repository. Review changes in pull requests, like any other code.',
  },
  {
    index: '03',
    title: 'Share the live form',
    body: 'Open your repository path on frms.dev without the .yaml extension. Preview branches before you merge.',
  },
];

const URL_PARTS: Array<{ text: string; label: string | null }> = [
  { text: 'https://frms.dev/', label: null },
  { text: 'your-org', label: 'owner' },
  { text: '/', label: null },
  { text: 'your-repo', label: 'repo' },
  { text: '/', label: null },
  { text: 'forms/signup', label: 'file path' },
  { text: '?branch=draft', label: 'branch' },
];

const FOOTER_COLUMNS: Array<{
  title: string;
  links: Array<{ href: string; label: string }>;
}> = [
  {
    title: 'Product',
    links: [
      { href: PLUGIN_URL, label: 'MCP plugin' },
      { href: '#pricing', label: 'Pricing' },
      { href: QUICK_START_URL, label: 'Create from YAML' },
      { href: GITHUB_URL, label: 'Source' },
    ],
  },
  {
    title: 'Project',
    links: [
      { href: `${GITHUB_URL}/blob/main/LICENSE`, label: 'AGPL-3.0 licence' },
      { href: '/privacy-policy', label: 'Privacy' },
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
            className="text-sm font-semibold text-ink underline-offset-4 hover:underline"
            href="#pricing"
          >
            Pricing
          </a>
          <a
            className="hidden text-sm font-semibold text-ink underline-offset-4 hover:underline md:inline"
            href={GITHUB_URL}
            rel="noreferrer"
          >
            GitHub
          </a>
          <ActionButton href={PLUGIN_URL}>Get MCP plugin</ActionButton>
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
          <p className="font-display text-5xl leading-[0.95] font-semibold tracking-[-0.03em] text-balance sm:text-6xl lg:text-7xl">
            Forms that live in your Git repo.
          </p>
          <p className="max-w-[46ch] text-lg leading-relaxed text-ink-muted">
            Define a form in YAML, commit it to a public GitHub repository, and
            share a live, hosted form. Start with a file or let your AI client
            create and update it through MCP.
          </p>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <ActionButton href={PLUGIN_URL} size="lg">
              Get MCP plugin
              <ArrowRight className="size-4" />
            </ActionButton>
            <a
              className="text-sm font-medium text-ink-muted underline underline-offset-4 hover:text-ink"
              href={QUICK_START_URL}
              rel="noreferrer"
            >
              Create from YAML
            </a>
          </div>
          <p className="max-w-[52ch] text-sm leading-relaxed text-ink-muted">
            Cloud hosting and MCP authoring are free. GitHub is used for
            sign-in; managed forms stay in Declarative Forms.
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
            {HERO_TICKS.map((tick) => (
              <li className="flex items-center gap-2" key={tick}>
                <Check className="size-4 text-brand-purple" strokeWidth={3} />
                <span className="text-sm font-medium text-ink">{tick}</span>
              </li>
            ))}
          </ul>
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
          <h2 className="font-display text-4xl leading-[0.95] font-semibold tracking-[-0.025em] text-balance sm:text-5xl">
            One file. Your existing workflow.
          </h2>
          <p className="max-w-[52ch] text-base leading-relaxed text-ink-muted">
            The definition lives in your repository, so changes are versioned,
            reviewable and reproducible—like the code and workflows it supports.
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
        <p className="mt-8 max-w-[64ch] text-base leading-relaxed text-ink-muted">
          Add an email connection to receive completed responses in your inbox,
          or a webhook to send them to your application.{' '}
          <a
            className="font-medium text-ink underline underline-offset-4"
            href={`${GITHUB_URL}/blob/main/SCHEMA.md#connections`}
          >
            Set up response delivery
          </a>
          .
        </p>
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
            The source of truth
          </span>
          <h2 className="font-display text-4xl leading-[0.95] font-semibold tracking-[-0.025em] text-balance sm:text-5xl">
            Draft safely. Publish when you’re ready.
          </h2>
          <p className="text-lg leading-relaxed text-white/85">
            Ask your AI client to create a draft branch, preview the hosted
            form, and publish that branch to main after review.
          </p>
          <p className="text-lg leading-relaxed text-white/85">
            Prefer Git as the source of truth? Copy the YAML into a public
            repository and keep using pull-request reviews and branch previews.
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
          <h2 className="font-display text-4xl leading-[0.95] font-semibold tracking-[-0.025em] text-balance sm:text-5xl">
            Missing a feature?
          </h2>
          <p className="max-w-[46ch] text-lg leading-relaxed text-ink-muted">
            Tell us what you need. If we accept your request, we’ll build it
            within 72 hours.
          </p>
          <p className="max-w-[52ch] text-sm leading-relaxed text-ink-muted">
            We’ll confirm acceptance and scope by email. The 72 hours starts
            when we accept.
          </p>
          <p className="max-w-[52ch] text-sm leading-relaxed text-ink-muted">
            This is a real Declarative Forms form, defined in our GitHub repo.
            Requests arrive in our inbox through an email connection.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
            <a
              className="underline underline-offset-4 hover:text-brand-purple"
              href={FEATURE_REQUEST_URL}
              target="_blank"
              rel="noreferrer"
            >
              Open form
            </a>
            <a
              className="underline underline-offset-4 hover:text-brand-purple"
              href={`${GITHUB_URL}/blob/main/examples/feature-request.yaml`}
              target="_blank"
              rel="noreferrer"
            >
              View YAML
            </a>
            <a
              className="underline underline-offset-4 hover:text-brand-purple"
              href={`mailto:?subject=${encodeURIComponent('Missing a feature in Declarative Forms?')}&body=${encodeURIComponent(`Request a feature. If accepted, they’ll build it within 72 hours.\n\n${FEATURE_REQUEST_URL}`)}`}
            >
              Share this form
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

function Pricing(): React.JSX.Element {
  return (
    <section
      className="border-t-2 border-ink bg-paper px-6 py-20 md:px-10 md:py-24 lg:px-16"
      id="pricing"
    >
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="font-display text-4xl leading-[0.95] font-semibold tracking-[-0.025em] text-balance sm:text-5xl">
          Free to get started. Free to keep using.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="flex flex-col items-start gap-6 rounded-lg border-2 border-ink bg-brand-yellow-soft p-6 shadow-hard md:p-8">
            <h3 className="font-display text-xl font-semibold">Cloud</h3>
            <p className="font-display text-4xl font-semibold tracking-[-0.025em]">
              Free
            </p>
            <p className="max-w-[44ch] text-base leading-relaxed text-ink-muted">
              Create forms through the MCP plugin or host YAML forms from public
              GitHub repositories. Cloud hosting is included.
            </p>
            <div className="mt-auto pt-2">
              <ActionButton href={PLUGIN_URL}>Get MCP plugin</ActionButton>
            </div>
          </div>
          <div className="flex flex-col items-start gap-6 rounded-lg border-2 border-ink bg-white p-6 shadow-hard md:p-8">
            <h3 className="font-display text-xl font-semibold">Enterprise</h3>
            <p className="font-display text-4xl font-semibold tracking-[-0.025em]">
              Custom pricing
            </p>
            <p className="max-w-[44ch] text-base leading-relaxed text-ink-muted">
              Contact us to discuss your requirements.
            </p>
            <div className="mt-auto pt-2">
              <ActionButton
                href="mailto:info@frms.dev?subject=Enterprise%20enquiry"
                variant="secondary"
              >
                Contact us
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta(): React.JSX.Element {
  return (
    <section className="border-t-4 border-ink bg-brand-yellow-soft px-6 py-20 md:px-10 md:py-24 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-7 text-center">
        <h2 className="font-display text-4xl leading-[0.95] font-semibold tracking-[-0.025em] text-balance sm:text-5xl">
          Your next form starts here.
        </h2>
        <p className="max-w-[48ch] text-lg leading-relaxed text-ink-muted">
          Create and host your form through MCP for free, or keep its YAML in
          GitHub. Choose the workflow that fits your project.
        </p>
        <ActionButton href={PLUGIN_URL} size="lg">
          Get MCP plugin
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
              Forms as Code for GitHub-native teams.
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
        <Pricing />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
