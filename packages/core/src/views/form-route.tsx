'use client';
import {
  resolveLocalizedText,
  type IDeclarativeForm,
} from '@declarativeforms/engine';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { DeclarativeForm, HeroSection, type FormEffect } from '@/components';
import { useI18n, useSyncLangParam } from '@/i18n';
import { createAnalytics, type Analytics } from '@/lib/analytics';
import { getBackendUrl } from '@/lib/api';
import { replacePath, replaceSearchParams } from '@/lib/url-state';
import { BasePage } from './base.page';

const RESERVED_QUERY_KEYS = new Set([
  'embed',
  'lang',
  'submission_id',
  'step',
  'branch',
]);

export type FormRouteProps = {
  id?: string;
  owner?: string;
  repository?: string;
  slugPath?: string;
};

export function FormRoute(props: FormRouteProps) {
  const router = useRouter();

  const i18n = useI18n();
  const searchParams = useSearchParams();
  const isSlugRoute = !!(props.owner && props.repository && props.slugPath);
  const branch = searchParams.get('branch');

  const [resumeSubmissionId] = useState(() =>
    searchParams.get('submission_id'),
  );

  const isCompletingRef = useRef(false);
  const hasRewrittenSlugRef = useRef(false);
  const analyticsRef = useRef<Analytics | null>(null);

  const formQuery = useQuery({
    queryKey: [
      'form',
      props.id,
      props.owner,
      props.repository,
      props.slugPath,
      branch,
    ],
    queryFn: async () => {
      const url = props.id
        ? getBackendUrl(`forms/${props.id}`)
        : props.owner && props.repository && props.slugPath
          ? getBackendUrl(
              `forms/${props.owner}/${props.repository}/${props.slugPath}`,
            )
          : '/default.yaml';

      const fetchUrl = new URL(url, window.location.origin);

      if (branch && url !== '/default.yaml') {
        fetchUrl.searchParams.set('branch', branch);
      }

      const response = await fetch(fetchUrl.toString());

      if (!response.ok) {
        throw new Error(`Form not found: ${response.status}`);
      }

      return (await response.json()) as IDeclarativeForm;
    },
  });

  const formId = formQuery.data?.id ?? props.id ?? '';

  const savedSubmissionQuery = useQuery({
    queryKey: ['submission', formId, resumeSubmissionId],
    queryFn: async () => {
      const response = await fetch(
        getBackendUrl(`forms/${formId}/submissions/${resumeSubmissionId}`),
      );
      if (!response.ok) {
        return null;
      }

      return (await response.json()) as { data?: Record<string, unknown> };
    },
    enabled: !!formId && !!resumeSubmissionId,
  });

  useEffect(() => {
    if (!isSlugRoute || !formQuery.data?.id || hasRewrittenSlugRef.current) {
      return;
    }

    hasRewrittenSlugRef.current = true;

    const nextSearch = new URLSearchParams(searchParams).toString();
    replacePath(
      nextSearch
        ? `/${formQuery.data.id}?${nextSearch}`
        : `/${formQuery.data.id}`,
    );
  }, [isSlugRoute, formQuery.data?.id, searchParams]);

  const urlPrefill: FieldValues = {};

  for (const [key, value] of searchParams.entries()) {
    if (RESERVED_QUERY_KEYS.has(key)) {
      continue;
    }

    urlPrefill[key] = value;
  }

  useSyncLangParam(formQuery.data?.locale);

  useEffect(() => {
    const analytics = createAnalytics(formQuery.data?.measurements);
    analyticsRef.current = analytics;

    analytics.capture('page_view', {
      form_id: formId || undefined,
    });

    return () => {
      if (analyticsRef.current === analytics) {
        analyticsRef.current = null;
      }
      analytics.shutdown();
    };
  }, [formQuery.data?.measurements, formId]);

  function updateProgressQuery(progress: {
    submissionId: string | null;
    step: string;
  }): void {
    const nextParams = new URLSearchParams(searchParams);

    if (progress.submissionId) {
      nextParams.set('submission_id', progress.submissionId);
    } else {
      nextParams.delete('submission_id');
    }

    if (progress.step) {
      nextParams.set('step', progress.step);
    } else {
      nextParams.delete('step');
    }

    replaceSearchParams(nextParams);
  }

  async function submitToBackend(
    submissionData: Record<string, unknown>,
    isPartial: boolean,
  ): Promise<string | undefined> {
    if (!formQuery.data) {
      return;
    }

    const submitFormId = formQuery.data.id ?? props.id;

    if (!submitFormId) {
      return;
    }

    const url = new URL(
      getBackendUrl(`forms/${submitFormId}/submissions`),
      window.location.origin,
    );

    if (isPartial) {
      url.searchParams.set('partial', 'true');
    }

    const currentSubmissionId = searchParams.get('submission_id');
    if (currentSubmissionId) {
      url.searchParams.set('id', currentSubmissionId);
    }

    const response = await fetch(url.toString(), {
      body: JSON.stringify(submissionData),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    const submissionResponse = await response.json();

    return submissionResponse?.id as string | undefined;
  }

  async function handleEffect(
    effect: FormEffect,
    runtimeState: {
      data: Record<string, unknown>;
      activeSectionId: string;
      completedSectionId: string;
    },
  ): Promise<void> {
    analyticsRef.current?.capture('section_completed', {
      form_id: formId || undefined,
      section_id: runtimeState.completedSectionId,
      is_final: effect.type !== 'submit',
    });

    switch (effect.type) {
      case 'submit': {
        const submissionId = await submitToBackend(
          runtimeState.data,
          effect.isPartial,
        );
        updateProgressQuery({
          submissionId: submissionId ?? searchParams.get('submission_id'),
          step: runtimeState.activeSectionId,
        });

        return;
      }

      case 'complete': {
        if (isCompletingRef.current) {
          return;
        }

        isCompletingRef.current = true;

        try {
          const submissionId = await submitToBackend(runtimeState.data, false);
          const finalSubmissionId =
            submissionId ?? searchParams.get('submission_id');

          updateProgressQuery({
            submissionId: finalSubmissionId,
            step: 'done',
          });
          const thankYouPath = `/${encodeURIComponent(formId)}/thank-you`;
          router.push(
            i18n.withLang(
              finalSubmissionId
                ? `${thankYouPath}?submission_id=${encodeURIComponent(finalSubmissionId)}`
                : thankYouPath,
            ),
          );

          return;
        } catch (error) {
          isCompletingRef.current = false;
          throw error;
        }
      }

      case 'redirect': {
        if (isCompletingRef.current) {
          return;
        }

        isCompletingRef.current = true;

        try {
          const submissionId = await submitToBackend(runtimeState.data, false);

          updateProgressQuery({
            submissionId: submissionId ?? searchParams.get('submission_id'),
            step: 'done',
          });
          window.location.href = effect.url;

          return;
        } catch (error) {
          isCompletingRef.current = false;
          throw error;
        }
      }
    }
  }

  if (formQuery.error) {
    return (
      <HeroSection
        title={i18n.t('main.form_not_found.title')}
        description={i18n.t('main.form_not_found.description')}
      />
    );
  }

  if (!formQuery.data) {
    return null;
  }

  if (resumeSubmissionId && savedSubmissionQuery.isLoading) {
    return null;
  }

  if (
    formQuery.data.start_date &&
    new Date(formQuery.data.start_date) > new Date()
  ) {
    return (
      <HeroSection
        title={i18n.t('main.form_not_yet_open.title')}
        description={i18n.t('main.form_not_yet_open.description')}
        theme={formQuery.data.theme}
      />
    );
  }

  if (
    formQuery.data.end_date &&
    new Date(formQuery.data.end_date) < new Date()
  ) {
    return (
      <HeroSection
        title={i18n.t('main.form_closed.title')}
        description={i18n.t('main.form_closed.description')}
        theme={formQuery.data.theme}
      />
    );
  }

  const initialData: FieldValues = {
    ...urlPrefill,
    ...(savedSubmissionQuery.data?.data ?? {}),
  };

  const stepParam = searchParams.get('step');
  const initialSectionId =
    stepParam &&
    (formQuery.data.sections ?? []).some((section) => section.id === stepParam)
      ? stepParam
      : formQuery.data.sections?.[0]?.id;

  const resolvedTitle =
    resolveLocalizedText(formQuery.data.title, i18n.locale) ||
    formQuery.data.id ||
    props.id ||
    '';
  const resolvedDescription = formQuery.data.description
    ? resolveLocalizedText(formQuery.data.description, i18n.locale)
    : undefined;

  return (
    <BasePage
      title={resolvedTitle}
      description={resolvedDescription}
      theme={formQuery.data.theme}
      embed={searchParams.get('embed') === 'true'}
    >
      <DeclarativeForm
        form={formQuery.data}
        locale={i18n.locale}
        initialData={initialData}
        initialSectionId={initialSectionId}
        onEffect={handleEffect}
      />
    </BasePage>
  );
}
