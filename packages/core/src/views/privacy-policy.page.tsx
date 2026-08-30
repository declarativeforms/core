'use client';

import { useI18n } from '@/i18n';

export function PrivacyPolicyPage() {
  const { t, withLang } = useI18n();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">
        {t('privacy_policy.title')}
      </h1>

      <div className="space-y-6 text-gray-600 leading-relaxed">
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
            Information We Collect
          </h2>
          <p>
            We collect information you provide directly through forms, including
            names, email addresses, and any other data you choose to submit.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            How We Use Information
          </h2>
          <p>
            We use the information collected to process form submissions and
            provide our services. We do not sell your personal information to
            third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Third-Party Services
          </h2>
          <p>
            We may use third-party services like Google or GitHub for
            authentication. These services have their own privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Contact Us
          </h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us.
          </p>
        </section>

        <div className="pt-8 border-t border-gray-100">
          <a
            href={withLang('/')}
            className="text-sm font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline transition-colors"
          >
            ← {t('privacy_policy.back_home')}
          </a>
        </div>
      </div>
    </div>
  );
}
