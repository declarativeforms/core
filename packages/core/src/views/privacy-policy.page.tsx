'use client';
import { useI18n } from '@/i18n';

export function PrivacyPolicyPage(): React.JSX.Element {
  const i18n = useI18n();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">
        {i18n.t('privacy_policy.title')}
      </h1>

      <div className="space-y-6 text-gray-600 leading-relaxed">
        <p className="text-sm">Last updated: 12 September 2026</p>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Introduction
          </h2>
          <p>
            This Privacy Policy explains how we collect, use, and protect your
            information when you use Declarative Forms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Information we collect
          </h2>
          <p>
            When you sign in to the Declarative Forms MCP service, we receive
            your stable GitHub account identifier and primary verified email
            address. We store the forms and draft branches you author, OAuth
            grants and tokens needed to keep your client connected, and
            operational logs. When you complete a hosted form, we process the
            answers and files that form requests.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            How we use information
          </h2>
          <p>
            We use account information to authenticate you and keep your forms
            in the correct personal workspace. We use form definitions to
            preview and publish forms, and submission data to deliver responses
            through the connections configured by the form author. We do not
            sell personal information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Sharing and service providers
          </h2>
          <p>
            GitHub provides sign-in. Our hosting, storage, email-delivery, abuse
            prevention, and optional analytics providers process only the data
            needed to provide those services. A form author may also configure
            an email or webhook connection that sends submissions to the named
            recipient. Those providers and recipients apply their own privacy
            terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Retention and security
          </h2>
          <p>
            We retain account and authored-form data while the account is in
            use, OAuth artifacts until they expire or are revoked, and
            submission data for as long as needed to operate the service and
            meet legal obligations. We use access controls, encryption in
            transit, and limited-scope tokens, but no online service can promise
            absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Your choices
          </h2>
          <p>
            You can revoke the Declarative Forms connection in your AI client or
            GitHub account. You may ask to access, correct, export, or delete
            your account data, subject to applicable law and records we must
            retain.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Contact us
          </h2>
          <p>
            For privacy questions or requests, email{' '}
            <a className="underline" href="mailto:info@frms.dev">
              info@frms.dev
            </a>
            .
          </p>
        </section>

        <div className="pt-8 border-t border-gray-100">
          <a
            href={i18n.withLang('/')}
            className="text-sm font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline transition-colors"
          >
            ← {i18n.t('privacy_policy.back_home')}
          </a>
        </div>
      </div>
    </div>
  );
}
