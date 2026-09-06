import type { ReactNode } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STUDIO_URL = 'https://studio.frms.dev';
const GITHUB_URL = 'https://github.com/declarativeforms/core';
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
    body: 'Fields, validation, branching and the completion screen live together in one YAML file.',
  },
  {
    index: '02',
    title: 'Review it in GitHub',
    body: 'Commit the file, open a pull request and review the change like any other diff.',
  },
  {
    index: '03',
    title: 'Share the live form',
    body: 'The definition renders as a hosted form, with branch previews available before you merge.',
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
      { href: STUDIO_URL, label: 'Studio' },
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
}) {
  const variant = props.variant ?? 'primary';
  const size = props.size ?? 'md';

  return (
    <a
      className={cn(
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

function BrandMark() {
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

function SiteNav() {
  return (
    <header className="border-b-2 border-ink bg-paper">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4 md:px-10 lg:px-16">
        <a
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          href="/"
        >
          <BrandMark />
        </a>
        <div className="flex items-center gap-6">
          <a
            className="hidden text-sm font-semibold text-ink underline-offset-4 hover:underline md:inline"
            href={GITHUB_URL}
            rel="noreferrer"
          >
            GitHub
          </a>
          <ActionButton href={STUDIO_URL}>Open Studio</ActionButton>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
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
            Define a form in YAML, commit it to GitHub, and it becomes a live,
            hosted form—without moving its source of truth into another
            dashboard.
          </p>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <ActionButton href={STUDIO_URL} size="lg">
              Open Studio
              <ArrowRight className="size-4" />
            </ActionButton>
            <a
              className="text-sm font-medium text-ink-muted underline underline-offset-4 hover:text-ink"
              href={GITHUB_URL}
              rel="noreferrer"
            >
              Explore the source
            </a>
          </div>
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

function HowItWorks() {
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
      </div>
    </section>
  );
}

function Tradeoff() {
  return (
    <section className="border-y-2 border-ink bg-brand-purple px-6 py-20 text-white md:px-10 md:py-24 lg:px-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex max-w-[58ch] flex-col gap-6">
          <span className="inline-block w-fit -rotate-1 border-2 border-ink bg-brand-yellow px-3 py-1 text-sm font-semibold text-ink">
            The source of truth
          </span>
          <h2 className="font-display text-4xl leading-[0.95] font-semibold tracking-[-0.025em] text-balance sm:text-5xl">
            Author it your way. Keep the result in Git.
          </h2>
          <p className="text-lg leading-relaxed text-white/85">
            Start with YAML or let Studio create it from a description. Either
            way, the canonical form is a structured file in your repository—not
            hidden state in another dashboard.
          </p>
          <p className="text-lg leading-relaxed text-white/85">
            That makes every change visible, reviewable and reversible, while
            Declarative Forms handles rendering, validation, submissions and the
            rest of the form experience.
          </p>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t-4 border-ink bg-brand-yellow-soft px-6 py-20 md:px-10 md:py-24 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-7 text-center">
        <h2 className="font-display text-4xl leading-[0.95] font-semibold tracking-[-0.025em] text-balance sm:text-5xl">
          Put your next form in the repo.
        </h2>
        <p className="max-w-[48ch] text-lg leading-relaxed text-ink-muted">
          Start in Studio or write the YAML yourself. You keep the definition;
          Declarative Forms handles the live form.
        </p>
        <ActionButton href={STUDIO_URL} size="lg">
          Open Studio
          <ArrowRight className="size-4" />
        </ActionButton>
      </div>
    </section>
  );
}

function SiteFooter() {
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

export function LandingPage() {
  return (
    <div className="flex min-h-lvh flex-col bg-paper">
      <link href={FONT_HREF} rel="stylesheet" />
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Tradeoff />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
