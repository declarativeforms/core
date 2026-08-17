import { resolveLocalizedText, type IDeclarativeForm } from '@declarativeforms/engine';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DeclarativeForm, HeroSection, type FormEffect } from '@/components';
import { useI18n, useSyncLangParam } from '@/i18n';
import { createAnalytics, type Analytics } from '@/lib/analytics';
import { getBackendUrl } from '@/lib/api';
import { BasePage } from './base.page';

const RESERVED_QUERY_KEYS = new Set([
  'embed',
  'lang',
  'submission_id',
  'step',
  'branch',
]);

export function MainPage() {
  const navigate = useNavigate();

  const { locale, t, withLang } = useI18n();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const slugPath = params['*'];
  const isSlugRoute = !!(params.owner && params.repository && slugPath);
  const branch = searchParams.get('branch');

  // Frozen at mount: the form hook captures initialData once, so the submission
  // we restore from must stay fixed even if the URL's submission_id changes as
  // sections are submitted. Everything else reads submission_id straight from
  // the query string, the source of truth.
  const [resumeSubmissionId] = useState(() =>
    searchParams.get('submission_id'),
  );

  const isCompletingRef = useRef(false);
  const analyticsRef = useRef<Analytics | null>(null);

  const { data: form, error } = useQuery({
    queryKey: [
      'form',
      params.id,
      params.owner,
      params.repository,
      slugPath,
      branch,
    ],
    queryFn: async () => {
      const url = params.id
        ? getBackendUrl(`forms/${params.id}`)
        : params.owner && params.repository && slugPath
          ? getBackendUrl(
              `forms/${params.owner}/${params.repository}/${slugPath}`,
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

  const formId = form?.id ?? params.id ?? '';

  // Restore previously-submitted answers on refresh/resume. Partial submits are
  // merged server-side, so this holds every prior section's data.
  const { data: savedSubmission, isLoading: isRestoringSubmission } = useQuery({
    queryKey: ['submission', formId, resumeSubmissionId],
    queryFn: async () => {
      const response = await fetch(
        getBackendUrl(`forms/${formId}/submissions/${resumeSubmissionId}`),
      );
      if (!response.ok) return null;
      return (await response.json()) as { data?: Record<string, unknown> };
    },
    enabled: !!formId && !!resumeSubmissionId,
  });

  useEffect(() => {
    if (!isSlugRoute || !form?.id) return;

    const nextParams = new URLSearchParams(searchParams);

    const nextSearch = nextParams.toString();
    navigate(nextSearch ? `/${form.id}?${nextSearch}` : `/${form.id}`, {
      replace: true,
    });
  }, [isSlugRoute, form?.id, navigate, searchParams]);

  const urlPrefill: FieldValues = {};

  for (const [key, value] of searchParams.entries()) {
    if (RESERVED_QUERY_KEYS.has(key)) {
      continue;
    }

    urlPrefill[key] = value;
  }

  useSyncLangParam(form?.locale);

  useEffect(() => {
    const analytics = createAnalytics(form?.measurements);
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
  }, [form?.measurements, formId]);

  function updateProgressQuery(progress: {
    submissionId: string | null;
    step: string;
  }) {
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

    setSearchParams(nextParams, { replace: true });
  }

  async function submitToBackend(
    submissionData: Record<string, unknown>,
    isPartial: boolean,
  ) {
    if (!form) {
      return;
    }

    const submitFormId = form.id ?? params.id;

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
  ) {
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
          navigate(
            withLang(
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

  if (error) {
    return (
      <HeroSection
        title={t('main.form_not_found.title')}
        description={t('main.form_not_found.description')}
      />
    );
  }

  if (!form) {
    return null;
  }

  // Seed the form only once the saved submission has loaded — the hook captures
  // initialData at mount, so mounting early would strip the restored answers.
  if (resumeSubmissionId && isRestoringSubmission) {
    return null;
  }

  if (form.start_date && new Date(form.start_date) > new Date()) {
    return (
      <HeroSection
        title={t('main.form_not_yet_open.title')}
        description={t('main.form_not_yet_open.description')}
        theme={form.theme}
      />
    );
  }

  if (form.end_date && new Date(form.end_date) < new Date()) {
    return (
      <HeroSection
        title={t('main.form_closed.title')}
        description={t('main.form_closed.description')}
        theme={form.theme}
      />
    );
  }

  const initialData: FieldValues = {
    ...urlPrefill,
    ...(savedSubmission?.data ?? {}),
  };

  const stepParam = searchParams.get('step');
  const initialSectionId =
    stepParam &&
    (form.sections ?? []).some((section) => section.id === stepParam)
      ? stepParam
      : form.sections?.[0]?.id;

  const resolvedTitle =
    resolveLocalizedText(form.title, locale) || form.id || params.id || '';
  const resolvedDescription = form.description
    ? resolveLocalizedText(form.description, locale)
    : undefined;

  return (
    <BasePage
      title={resolvedTitle}
      description={resolvedDescription}
      theme={form.theme}
      embed={searchParams.get('embed') === 'true'}
    >
      <DeclarativeForm
        form={form}
        locale={locale}
        initialData={initialData}
        initialSectionId={initialSectionId}
        onEffect={handleEffect}
      />
    </BasePage>
  );
}
