import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';
import {
  ActionButton,
  BrandMark,
  FONT_HREF,
  McpEndpoint,
} from '@/components/marketing';

const GITHUB_URL = 'https://github.com/declarativeforms/core';
const LINKEDIN_URL = 'https://www.linkedin.com/company/declarativeforms';
const GET_STARTED_URL = `${GITHUB_URL}#get-started`;
const FEATURE_REQUEST_URL =
  'https://frms.dev/declarativeforms/core/examples/feature-request';

const HERO_YAML = `# forms/beta-access.yaml
version: 1
title: "Request beta access"

sections:
  - id: application
    fields:
      - id: email
        type: email
        label: "Email address"
        validators: [required]

    next: done
`;

const STEPS: Array<{ index: string; title: string; body: string }> = [
  {
    index: '01',
    title: 'Describe the form',
    body: 'Write a definition or describe it to ChatGPT. Set the questions, validation, and what happens next.',
  },
  {
    index: '02',
    title: 'Publish the definition',
    body: 'Push your file to GitHub, or let ChatGPT create a hosted form. The same runtime brings either definition to life.',
  },
  {
    index: '03',
    title: 'Open the form',
    body: 'Share the live link. Update the definition whenever you need to change the form.',
  },
];

const URL_PARTS: Array<{ text: string; label: string | null }> = [
  { text: 'https://frms.dev/', label: null },
  { text: 'your-org', label: 'owner' },
  { text: '/', label: null },
  { text: 'your-repo', label: 'repository' },
  { text: '/', label: null },
  { text: 'forms/beta-access', label: 'definition' },
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
      { href: GITHUB_URL, label: 'Source code' },
      { href: '#connect-chatgpt', label: 'Connect ChatGPT' },
    ],
  },
  {
    title: 'Project',
    links: [
      { href: `${GITHUB_URL}/blob/main/LICENSE`, label: 'AGPL-3.0 license' },
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

function AuthoringActions(): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <ActionButton href="#connect-chatgpt">Build with ChatGPT</ActionButton>
      <a
        className="inline-flex min-h-11 items-center text-sm font-semibold underline decoration-ink/30 underline-offset-4 hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-4"
        href={GET_STARTED_URL}
      >
        Use GitHub
      </a>
    </div>
  );
}

function SiteNav(): React.JSX.Element {
  return (
    <header className="border-b-2 border-ink bg-paper">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-4 sm:px-5 md:px-10 lg:px-0"
      >
        <Link
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          href="/"
        >
          <BrandMark />
        </Link>
        <a
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold underline underline-offset-4 hover:text-brand-purple focus-visible:outline-2 focus-visible:outline-offset-4"
          href="#connect-chatgpt"
        >
          Get started
        </a>
      </nav>
    </header>
  );
}

function Hero(): React.JSX.Element {
  return (
    <section className="border-b-2 border-ink bg-paper-alt px-5 py-10 sm:px-6 md:px-10 md:py-16 lg:px-16">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div className="flex flex-col items-start gap-5">
          <span className="-rotate-1 border-2 border-ink bg-brand-yellow px-3 py-1 text-sm font-semibold text-ink">
            Open-source Forms as Code
          </span>
          <h1 className="font-display text-[2.5rem] leading-[1.1] font-semibold tracking-[-0.02em] text-balance sm:text-5xl lg:text-6xl">
            A live form from a file you own.
          </h1>
          <p className="max-w-[44ch] text-base leading-relaxed text-ink-muted sm:text-lg">
            Define your form in GitHub or with ChatGPT. Get a working form you
            can share, inspect, and change—without building the application.
          </p>
          <AuthoringActions />
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
    <section className="bg-paper px-5 py-12 sm:px-6 md:px-10 md:py-16 lg:px-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-3xl leading-[1.15] font-semibold tracking-[-0.02em] text-balance sm:text-4xl lg:text-[2.5rem]">
            From definition to live form.
          </h2>
          <p className="max-w-[52ch] text-base leading-relaxed text-ink-muted">
            You define what the form should do. Declarative Forms supplies the
            runtime that makes it work.
          </p>
        </div>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
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
        <details className="mt-6">
          <summary className="w-fit cursor-pointer py-3 text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">
            How GitHub form URLs work
          </summary>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
            The URL points to your definition. Use a branch to preview changes
            before merging.
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border-2 border-ink bg-brand-purple-soft p-6 shadow-hard">
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
        </details>
      </div>
    </section>
  );
}

function ChatGptSetup(): React.JSX.Element {
  return (
    <section
      id="connect-chatgpt"
      className="scroll-mt-6 border-y-2 border-ink bg-brand-yellow-soft px-5 py-12 sm:px-6 md:px-10 md:py-16 lg:px-16"
    >
      <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-4">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            Your next form can start with a conversation.
          </h2>
          <p className="max-w-[45ch] text-base leading-relaxed text-ink-muted">
            Connect ChatGPT to create, inspect, and update your forms. It can
            read the schema, so you can focus on what you need.
          </p>
          <blockquote className="max-w-[45ch] border-l-4 border-brand-purple pl-4 text-base leading-relaxed">
            “Create a workshop sign-up form with name, email, and a choice of
            session. Give me the live link.”
          </blockquote>
        </div>
        <div className="rounded-lg border-2 border-ink bg-white p-5 shadow-hard sm:p-6">
          <McpEndpoint />
          <div className="mt-2">
            <ActionButton href="https://chatgpt.com/plugins">
              Open ChatGPT
              <ArrowRight className="size-4" />
            </ActionButton>
          </div>
          <details className="mt-5 border-t-2 border-ink pt-2">
            <summary className="cursor-pointer py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4">
              Connection instructions
            </summary>
            <ol className="mt-2 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink-muted">
              <li>
                In ChatGPT’s Plugins page, choose +, then Add custom MCP server.
              </li>
              <li>
                Name it Declarative Forms, paste the URL above, and select OAuth
                with CIMD.
              </li>
              <li>
                Acknowledge the notice, choose Create as a plugin, and install
                it. Continue with GitHub to sign in; no repository access is
                requested.
              </li>
              <li>
                Select Declarative Forms with @ in your conversation and
                describe your form. Later, ask it to update the same form.
              </li>
            </ol>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              Forms are hosted on frms.dev and published immediately. Anyone
              with the link can fill them out.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Custom plugins depend on your account and workspace permissions.{' '}
              <a
                className="underline"
                href="https://developers.openai.com/api/docs/guides/custom-mcp-server"
              >
                Official setup guide
              </a>
              . Claude and other clients are not yet supported.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}

function Tradeoff(): React.JSX.Element {
  return (
    <section className="border-y-2 border-ink bg-brand-purple px-5 py-12 text-white sm:px-6 md:px-10 md:py-16 lg:px-16">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-5">
          <span className="inline-block -rotate-1 border-2 border-ink bg-brand-yellow px-3 py-1 text-sm font-semibold text-ink">
            You own the definition. We run it.
          </span>
          <h2 className="max-w-[19ch] font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            Keep the control. Skip building the form system.
          </h2>
          <p className="max-w-[44ch] text-base leading-relaxed text-white/85">
            Use frms.dev for hosting, or self-host the open-source stack. Your
            form stays an explicit definition you can inspect and reuse.
          </p>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="font-display text-xl font-semibold">
              A definition you can work with
            </h3>
            <p className="mt-2 text-base leading-relaxed text-white/85">
              Inspect and update hosted forms through ChatGPT. Keep definitions
              in GitHub when you want review, branches, and version history.
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold">
              The form behavior, already built
            </h3>
            <p className="mt-2 text-base leading-relaxed text-white/85">
              Multi-step flows, conditional questions, validation, uploads, and
              localized content. Answers are stored and can flow to email or
              webhooks.
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold">
              Questions that can adapt
            </h3>
            <p className="mt-2 text-base leading-relaxed text-white/85">
              Adaptive sections use AI to ask follow-up questions around your
              objectives and return structured outputs.
            </p>
            <a
              className="mt-2 inline-block text-sm underline underline-offset-4"
              href={`${GITHUB_URL}/blob/main/examples/adaptive.yaml`}
            >
              Explore an adaptive definition
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureRequests(): React.JSX.Element {
  return (
    <section
      className="bg-paper-alt px-5 py-12 sm:px-6 md:px-10 md:py-16 lg:px-16"
      id="feature-requests"
    >
      <div className="mx-auto grid w-full max-w-6xl items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <h2 className="font-display text-3xl leading-[1.15] font-semibold tracking-[-0.02em] text-balance sm:text-4xl lg:text-[2.5rem]">
            See the definition at work.
          </h2>
          <p className="max-w-[48ch] text-base leading-relaxed text-ink-muted">
            Try the live feature-request form, then inspect the YAML behind it.
            It stores submissions and sends requests to our inbox.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
            <a
              className="underline underline-offset-4 hover:text-brand-purple"
              href={FEATURE_REQUEST_URL}
              target="_blank"
              rel="noreferrer"
            >
              Open the live form
            </a>
            <a
              className="underline underline-offset-4 hover:text-brand-purple"
              href={`${GITHUB_URL}/blob/main/examples/feature-request.yaml`}
              target="_blank"
              rel="noreferrer"
            >
              Inspect its YAML
            </a>
          </div>
          <div className="mt-4 flex max-w-[52ch] flex-col gap-3 border-t-2 border-ink pt-6">
            <h3 className="font-display text-xl font-semibold tracking-[-0.02em]">
              Need something the product does not support yet?
            </h3>
            <p className="text-base leading-relaxed text-ink-muted">
              Tell us what your workflow needs. If we accept the request, we’ll
              build it within 72 hours.
            </p>
            <p className="text-sm leading-relaxed text-ink-muted">
              We’ll confirm acceptance and scope by email. The 72-hour window
              starts when we accept.
            </p>
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
    <section className="bg-paper px-5 py-12 sm:px-6 md:px-10 md:py-16 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          Make your next form.
        </h2>
        <AuthoringActions />
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
              Open-source Forms as Code. Hosted on frms.dev or self-hosted.
            </p>
            <div className="flex items-center gap-2">
              <a
                aria-label="Declarative Forms on LinkedIn"
                className="inline-flex size-8 items-center justify-center rounded-md border-2 border-ink bg-paper text-ink transition-colors duration-150 hover:bg-brand-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                href={LINKEDIN_URL}
                rel="noreferrer"
              >
                <FaLinkedin aria-hidden="true" className="size-4" />
              </a>
              <a
                aria-label="Declarative Forms on GitHub"
                className="inline-flex size-8 items-center justify-center rounded-md border-2 border-ink bg-paper text-ink transition-colors duration-150 hover:bg-brand-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                href={GITHUB_URL}
                rel="noreferrer"
              >
                <FaGithub aria-hidden="true" className="size-4" />
              </a>
            </div>
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
        <ChatGptSetup />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
