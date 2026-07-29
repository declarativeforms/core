import { resolveLocalizedText } from '@declarativeforms/core';
import type { FormDefinition, FormEffect } from '@declarativeforms/core';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DeclarativeForm, HeroSection } from '@/components';
import { useI18n } from '@declarativeforms/react';
import { getBackendUrl } from '@/lib/api';
import { BasePage } from './base.page';

const RESERVED_QUERY_KEYS = new Set([
  'embed',
  'lang',
  'ref',
  'resume_token',
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
  const refParam = searchParams.get('ref');

  const embed = searchParams.get('embed') === 'true';
  const resumeToken = searchParams.get('resume_token');
  const querySubmissionId = resumeToken
    ? searchParams.get('submission_id')
    : null;
  const stepParam = searchParams.get('step');
  const langParam = searchParams.get('lang');

  const submissionIdRef = useRef(querySubmissionId);
  const resumeTokenRef = useRef(resumeToken);
  const isCompletingRef = useRef(false);
  const mixpanelRef = useRef<{
    track(event: string, properties?: Record<string, unknown>): void;
  } | null>(null);

  const { data: form, error } = useQuery({
    queryKey: [
      'form',
      params.id,
      params.owner,
      params.repository,
      slugPath,
      refParam,
    ],
    queryFn: async () => {
      const url = params.id
        ? getBackendUrl(`forms/${params.id}`)
        : params.owner && params.repository && slugPath
          ? buildGitHubFormUrl(
              params.owner,
              params.repository,
              slugPath,
              refParam,
            )
          : '/default.yaml';

      const response = await fetch(new URL(url, window.location.origin));

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: { code?: string; details?: string[]; message?: string };
        } | null;
        throw new FormLoadError(
          response.status,
          body?.error?.code,
          body?.error?.message,
          body?.error?.details,
        );
      }

      return (await response.json()) as FormDefinition;
    },
  });

  const formId = form?.id ?? params.id ?? '';

  const {
    data: resumedSubmission,
    error: resumeError,
    isLoading: isResumeLoading,
  } = useQuery({
    queryKey: ['submission-resume', formId, resumeToken],
    enabled: Boolean(formId && resumeToken),
    retry: false,
    queryFn: async () => {
      const url = new URL(
        getBackendUrl(`forms/${encodeURIComponent(formId)}/submissions/resume`),
        window.location.origin,
      );
      url.searchParams.set('token', resumeToken || '');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Resume failed: ${response.status}`);
      }
      return (await response.json()) as {
        data: Record<string, unknown>;
        id: string;
        status: 'partial' | 'completed';
      };
    },
  });

  const submissionId = resumedSubmission?.id ?? querySubmissionId;

  useEffect(() => {
    submissionIdRef.current = submissionId;
    resumeTokenRef.current = resumeToken;
  }, [resumeToken, submissionId]);

  const initialData: Record<string, unknown> = {
    ...(resumedSubmission?.data ?? {}),
  };

  for (const [key, value] of searchParams.entries()) {
    if (RESERVED_QUERY_KEYS.has(key)) {
      continue;
    }

    initialData[key] = value;
  }

  useEffect(() => {
    if (!form?.locale || langParam) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('lang', form.locale);
    setSearchParams(nextParams);
  }, [form?.locale, langParam, searchParams, setSearchParams]);

  useEffect(() => {
    if (form?.measurements?.mixpanel && !resumeToken) {
      let cancelled = false;
      void import('mixpanel-browser').then(({ default: mixpanel }) => {
        if (cancelled) return;
        mixpanel.init(form.measurements?.mixpanel || '', {
          api_host: 'https://api-eu.mixpanel.com',
        });
        mixpanelRef.current = mixpanel;
        mixpanel.track('page_view', {
          form_id: formId || undefined,
        });
      });
      return () => {
        cancelled = true;
        mixpanelRef.current = null;
      };
    }
    mixpanelRef.current = null;
  }, [form?.measurements?.mixpanel, formId, resumeToken]);

  function updateProgressQuery(progress: {
    resumeToken: string | null;
    submissionId: string | null;
    step: string;
  }) {
    const nextParams = new URLSearchParams(searchParams);

    if (progress.submissionId) {
      nextParams.set('submission_id', progress.submissionId);
    } else {
      nextParams.delete('submission_id');
    }

    if (progress.resumeToken) {
      nextParams.set('resume_token', progress.resumeToken);
    } else {
      nextParams.delete('resume_token');
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
  ): Promise<{ id?: string; resumeToken?: string } | undefined> {
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

    if (submissionIdRef.current && resumeTokenRef.current) {
      url.searchParams.set('id', submissionIdRef.current);
      url.searchParams.set('resume_token', resumeTokenRef.current);
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

    const nextId =
      typeof submissionResponse?.id === 'string'
        ? submissionResponse.id
        : undefined;
    const nextResumeToken =
      typeof submissionResponse?.resume_token === 'string'
        ? submissionResponse.resume_token
        : undefined;
    if (nextId) {
      submissionIdRef.current = nextId;
    }
    if (nextResumeToken) {
      resumeTokenRef.current = nextResumeToken;
    }
    return { id: nextId, resumeToken: nextResumeToken };
  }

  async function handleEffect(
    effect: FormEffect,
    runtimeState: { data: Record<string, unknown>; activeSectionId: string },
  ) {
    if (form?.measurements?.mixpanel && !resumeTokenRef.current) {
      mixpanelRef.current?.track('section_completed', {
        form_id: formId || undefined,
      });
    }

    switch (effect.type) {
      case 'submit': {
        const result = await submitToBackend(
          runtimeState.data,
          effect.isPartial,
        );
        updateProgressQuery({
          resumeToken: result?.resumeToken ?? resumeTokenRef.current,
          submissionId: result?.id ?? submissionIdRef.current,
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
          const result = await submitToBackend(runtimeState.data, false);
          const finalSubmissionId = result?.id ?? submissionIdRef.current;

          updateProgressQuery({
            resumeToken: result?.resumeToken ?? resumeTokenRef.current,
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
          const result = await submitToBackend(runtimeState.data, false);

          updateProgressQuery({
            resumeToken: result?.resumeToken ?? resumeTokenRef.current,
            submissionId: result?.id ?? submissionIdRef.current,
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
    const loadError =
      error instanceof FormLoadError
        ? getFormLoadErrorContent(error)
        : {
            title: t('main.form_not_found.title'),
            description: t('main.form_not_found.description'),
          };
    return (
      <HeroSection
        title={loadError.title}
        description={loadError.description}
      />
    );
  }

  if (!form) {
    return null;
  }

  if (resumeError) {
    return (
      <HeroSection
        title={t('main.form_not_found.title')}
        description="This resume link is invalid or has expired."
        theme={form.theme}
      />
    );
  }

  if (resumeToken && isResumeLoading) {
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
        initialCompleted={resumedSubmission?.status === 'completed'}
        initialSectionId={initialSectionId}
        formId={formId}
        onEffect={handleEffect}
      />
    </BasePage>
  );
}

class FormLoadError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details: string[];

  constructor(
    status: number,
    code?: string,
    message?: string,
    details: string[] = [],
  ) {
    super(message || `The form could not be loaded (${status}).`);
    this.name = 'FormLoadError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function buildGitHubFormUrl(
  owner: string,
  repository: string,
  path: string,
  ref: string | null,
): string {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const url = getBackendUrl(
    `forms/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/${encodedPath}`,
  );
  return ref ? `${url}?ref=${encodeURIComponent(ref)}` : url;
}

function getFormLoadErrorContent(error: FormLoadError): {
  title: string;
  description: string;
} {
  if (
    error.code === 'INVALID_FORM_DEFINITION' ||
    error.code === 'INVALID_FORM_YAML'
  ) {
    return {
      title:
        error.code === 'INVALID_FORM_YAML'
          ? 'Invalid form YAML'
          : 'Invalid form definition',
      description: [error.message, ...error.details].join(' '),
    };
  }

  if (error.code === 'GITHUB_RATE_LIMITED') {
    return {
      title: 'GitHub rate limit reached',
      description: error.message,
    };
  }

  if (
    error.code === 'GITHUB_UNAVAILABLE' ||
    error.code === 'GITHUB_AUTH_FAILED'
  ) {
    return {
      title: 'GitHub source unavailable',
      description: error.message,
    };
  }

  if (error.code === 'GITHUB_SOURCE_TOO_LARGE') {
    return {
      title: 'Form definition is too large',
      description: error.message,
    };
  }

  return {
    title: 'Form not found',
    description: error.message,
  };
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
  window.dispatchEvent(new Event('declarativeforms:locationchange'));
}
