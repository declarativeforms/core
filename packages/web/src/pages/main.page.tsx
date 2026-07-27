import { resolveLocalizedText } from '@declarativeforms/core';
import type { FormDefinition, FormEffect } from '@declarativeforms/core';
import { useQuery } from '@tanstack/react-query';
import mixpanel from 'mixpanel-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DeclarativeForm,
  HeroSection,
} from '@/components';
import { useI18n } from '@declarativeforms/react';
import { getBackendUrl } from '@/lib/api';
import { BasePage } from './base.page';

const RESERVED_QUERY_KEYS = new Set([
  'embed',
  'lang',
  'submission_id',
  'step',
]);

export function MainPage(props: {
  params: {
    id?: string;
    owner?: string;
    repository?: string;
    slugPath?: string;
  };
}) {
  const { locale, t } = useI18n();
  const params = props.params;
  const [searchParams, setSearchParams] = useBrowserSearchParams();
  const slugPath = params.slugPath;
  const isSlugRoute = !!(params.owner && params.repository && slugPath);

  const embed = searchParams.get('embed') === 'true';
  const submissionId = searchParams.get('submission_id');
  const stepParam = searchParams.get('step');
  const langParam = searchParams.get('lang');

  const submissionIdRef = useRef(submissionId);
  const isCompletingRef = useRef(false);

  useEffect(() => {
    submissionIdRef.current = submissionId;
  }, [submissionId]);

  const { data: form, error } = useQuery({
    queryKey: [
      'form',
      params.id,
      params.owner,
      params.repository,
      slugPath,
    ],
    queryFn: async () => {
      const url = params.id
        ? getBackendUrl(`forms/${params.id}`)
        : params.owner && params.repository && slugPath
          ? getBackendUrl(
              `forms/${params.owner}/${params.repository}/${slugPath}`,
            )
          : '/default.yaml';

      const response = await fetch(new URL(url, window.location.origin));

      if (!response.ok) {
        throw new Error(`Form not found: ${response.status}`);
      }

      return (await response.json()) as FormDefinition;
    },
  });

  const formId = form?.id ?? params.id ?? '';

  useEffect(() => {
    if (!isSlugRoute || !form?.id) return;

    replaceBrowserUrl(`/${form.id}`, searchParams);
  }, [isSlugRoute, form?.id, searchParams]);

  const initialData: Record<string, unknown> = {};

  for (const [key, value] of searchParams.entries()) {
    if (RESERVED_QUERY_KEYS.has(key)) {
      continue;
    }

    initialData[key] = value;
  }

  useEffect(() => {
    if (!form?.locale || langParam === form.locale) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('lang', form.locale);
    setSearchParams(nextParams);
  }, [form?.locale, langParam, searchParams, setSearchParams]);

  useEffect(() => {
    if (form?.measurements?.mixpanel) {
      mixpanel.init(form.measurements.mixpanel, {
        api_host: 'https://api-eu.mixpanel.com',
      });

      mixpanel.track('page_view', {
        form_id: formId || undefined,
      });
    }
  }, [form?.measurements?.mixpanel, formId]);

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

    setSearchParams(nextParams);
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

    if (submissionIdRef.current) {
      url.searchParams.set('id', submissionIdRef.current);
    }

    const response = await fetch(url.toString(), {
      body: JSON.stringify(submissionData),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Submission failed: ${response.status}`);
    }
    const submissionResponse = await response.json();

    return submissionResponse?.id as string | undefined;
  }

  async function handleEffect(
    effect: FormEffect,
    runtimeState: { data: Record<string, unknown>; activeSectionId: string },
  ) {
    if (form?.measurements?.mixpanel) {
      mixpanel.track('section_completed', {
        form_id: formId || undefined,
      });
    }

    switch (effect.type) {
      case 'submit': {
        const submissionId = await submitToBackend(
          runtimeState.data,
          effect.isPartial,
        );
        updateProgressQuery({
          submissionId: submissionId ?? submissionIdRef.current,
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
          const finalSubmissionId = submissionId ?? submissionIdRef.current;

          updateProgressQuery({
            submissionId: finalSubmissionId,
            step: 'done',
          });
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
            submissionId: submissionId ?? submissionIdRef.current,
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
      embed={embed}
    >
      <DeclarativeForm
        key={formId}
        definition={form}
        locale={locale}
        initialData={initialData}
        initialSectionId={initialSectionId}
        onEffect={handleEffect}
      />
    </BasePage>
  );
}

function useBrowserSearchParams() {
  const [searchParams, setSearchParamsState] = useState(
    () => new URLSearchParams(window.location.search),
  );
  const replaceSearchParams = useCallback((next: URLSearchParams) => {
    replaceBrowserUrl(window.location.pathname, next);
    setSearchParamsState(new URLSearchParams(next));
  }, []);

  return [searchParams, replaceSearchParams] as const;
}

function replaceBrowserUrl(pathname: string, searchParams: URLSearchParams) {
  const search = searchParams.toString();
  window.history.replaceState(
    null,
    '',
    search ? `${pathname}?${search}` : pathname,
  );
}
