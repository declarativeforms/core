'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { HeroSection } from '@/components';
import {
  compile,
  resolve,
  type IDeclarativeForm,
} from '@declarativeforms/engine';
import { useI18n, useSyncLangParam } from '@/i18n';
import { getBackendUrl } from '@/lib/api';

type SubmissionPayload = {
  data: Record<string, unknown>;
};

export function ThankYouPage(props: { id: string }) {
  const i18n = useI18n();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('submission_id');

  const formQuery = useQuery({
    queryKey: ['form', props.id],
    queryFn: async () => {
      const url = getBackendUrl(`forms/${props.id}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Form not found: ${response.status}`);
      }

      return (await response.json()) as IDeclarativeForm;
    },
    enabled: !!props.id,
  });

  const formId = formQuery.data?.id ?? props.id;

  const submissionQuery = useQuery({
    queryKey: ['submission', formId, submissionId],
    queryFn: async () => {
      if (!formId) {
        return null;
      }

      const response = await fetch(
        getBackendUrl(`forms/${formId}/submissions/${submissionId}`),
      );
      if (!response.ok) {
        return null;
      }

      return response.json() as Promise<SubmissionPayload>;
    },
    enabled: !!formId && !!submissionId,
  });

  useSyncLangParam(formQuery.data?.locale);

  const translate = i18n.t;

  useEffect(() => {
    document.title = translate('thank_you.page_title');
  }, [translate]);

  if (formQuery.isLoading) {
    return null;
  }

  const completion = formQuery.data
    ? compile(
        resolve(formQuery.data, i18n.locale),
        submissionQuery.data?.data ?? {},
      ).completion
    : undefined;

  if (completion) {
    return (
      <HeroSection
        title={completion.title ?? i18n.t('thank_you.default_title')}
        description={
          completion.message ?? i18n.t('thank_you.default_description')
        }
        buttonLabel={completion.button?.label}
        buttonHref={completion.button?.url}
        theme={formQuery.data?.theme}
      />
    );
  }

  return (
    <HeroSection
      title={i18n.t('thank_you.default_title')}
      description={i18n.t('thank_you.default_description')}
      theme={formQuery.data?.theme}
    />
  );
}
