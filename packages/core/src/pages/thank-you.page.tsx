import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { HeroSection, type IDeclarativeForm } from '@/components';
import { compile, resolve } from '@declarativeforms/engine';
import { useI18n, useSyncLangParam } from '@/i18n';
import { getBackendUrl } from '@/lib/api';

type SubmissionPayload = {
  data: Record<string, unknown>;
};

export function ThankYouPage() {
  const { locale, t } = useI18n();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('submission_id');

  const { data: form, isLoading: isFormLoading } = useQuery({
    queryKey: ['form', params.id],
    queryFn: async () => {
      const url = getBackendUrl(`forms/${params.id}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Form not found: ${response.status}`);
      }

      return (await response.json()) as IDeclarativeForm;
    },
    enabled: !!params.id,
  });

  const formId = form?.id ?? params.id;

  const { data: submission } = useQuery({
    queryKey: ['submission', formId, submissionId],
    queryFn: async () => {
      if (!formId) {
        return null;
      }

      const response = await fetch(
        getBackendUrl(`forms/${formId}/submissions/${submissionId}`),
      );
      if (!response.ok) return null;
      return response.json() as Promise<SubmissionPayload>;
    },
    enabled: !!formId && !!submissionId,
  });

  useSyncLangParam(form?.locale);

  useEffect(() => {
    document.title = t('thank_you.page_title');
  }, [t]);

  if (isFormLoading) {
    return null;
  }

  const submissionData = submission?.data ?? {};
  const completion = form
    ? compile(resolve(form, locale), submissionData).completion
    : undefined;

  if (completion) {
    return (
      <HeroSection
        title={completion.title ?? t('thank_you.default_title')}
        description={completion.message ?? t('thank_you.default_description')}
        buttonLabel={completion.button?.label}
        buttonHref={completion.button?.url}
        theme={form?.theme}
      />
    );
  }

  return (
    <HeroSection
      title={t('thank_you.default_title')}
      description={t('thank_you.default_description')}
      theme={form?.theme}
    />
  );
}
