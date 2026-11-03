import 'server-only';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ActionButton, BrandMark, FONT_HREF } from '@/components/marketing';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Connect ChatGPT',
  robots: { index: false, follow: false },
};

export default async function AuthorizePage(props: {
  searchParams: Promise<{ consent?: string; error?: string }>;
}): Promise<React.JSX.Element> {
  const query = await props.searchParams;
  const consent =
    typeof query.consent === 'string' &&
    /^[A-Za-z0-9_-]{43}$/.test(query.consent) &&
    !query.error
      ? query.consent
      : null;

  return (
    <main className="flex min-h-lvh flex-col items-center bg-paper px-6 py-12 text-ink">
      <link href={FONT_HREF} rel="stylesheet" />
      <Link href="/" className="mb-12">
        <BrandMark />
      </Link>
      <section className="w-full max-w-xl space-y-6 rounded-lg border-2 border-ink bg-white p-6 shadow-hard-lg sm:p-10">
        <span className="inline-block -rotate-1 border-2 border-ink bg-brand-yellow px-3 py-1 text-sm font-semibold">
          Your forms, connected
        </span>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {consent
            ? 'Connect ChatGPT to Declarative Forms'
            : 'Start a new connection'}
        </h1>
        {consent ? (
          <>
            <p className="text-ink-muted">
              ChatGPT will be able to list, read, create, and update your forms.
            </p>
            <p className="text-ink-muted">
              Created forms are published immediately. Anyone with the link can
              fill them out.
            </p>
            <p className="text-ink-muted">
              GitHub is used only to sign you in. Repository access is not
              requested.
            </p>
            <form method="post" action="/oauth/authorize">
              <input type="hidden" name="consent" value={consent} />
              <button
                type="submit"
                className="w-full rounded-md border-2 border-ink bg-brand-yellow px-5 py-3 font-semibold shadow-hard hover:bg-brand-yellow-soft focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Continue with GitHub
              </button>
            </form>
            <p className="text-sm text-ink-muted">
              You’ll return to ChatGPT after signing in. To cancel, close this
              window.
            </p>
          </>
        ) : (
          <>
            <p className="text-ink-muted">
              This connection is missing, expired, or has already been used.
              Return to ChatGPT and start connecting Declarative Forms again.
            </p>
            <ActionButton href="https://chatgpt.com/plugins">
              Return to ChatGPT
            </ActionButton>
            <p>
              <Link className="text-sm underline" href="/#connect-chatgpt">
                View setup instructions
              </Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}
