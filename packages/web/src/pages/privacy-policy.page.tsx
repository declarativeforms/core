import { useI18n } from '@declarativeforms/react';

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
            This installation is operated by the organization or person who
            shared the form with you. They are responsible for explaining how
            they use and protect your information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Information We Collect
          </h2>
          <p>
            The installation stores the answers and files you submit, together
            with basic request metadata such as your browser and IP address.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            How We Use Information
          </h2>
          <p>
            Your information is used to process the form submission. The form
            owner decides its purpose, retention period, and who can read it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Third-Party Services
          </h2>
          <p>
            A trusted form owner may configure email, webhooks, analytics, or
            address lookup. Those providers receive data only when the
            corresponding feature is enabled and have their own privacy terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Contact Us
          </h2>
          <p>
            Contact the organization or person who shared the form for privacy
            questions, access requests, or deletion requests.
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
