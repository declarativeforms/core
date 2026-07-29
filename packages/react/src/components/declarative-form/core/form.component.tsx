import type { FormDefinition, FormEffect } from '@declarativeforms/core';
import { useEffect, useRef, useState } from 'react';
import type { FieldValues } from 'react-hook-form';

import {
  createFieldComponentRegistry,
  type FieldComponentOverrides,
} from './field-registry';
import { FormViewRenderer } from './section.component';
import { useFormRuntime } from './use-runtime';
import { Button } from '../../ui';
import { useI18n } from '../../../i18n';
import { I18nProvider } from '../../../i18n';
import { PlainText } from '../supporting/plain-text';
import { RendererApiProvider, useRendererApi } from '../../../lib/renderer-api';

export type FormRendererProps = {
  apiBaseUrl?: string;
  definition: FormDefinition;
  locale: string;
  initialData: FieldValues;
  initialCompleted?: boolean;
  initialSectionId?: string;
  formId?: string;
  components?: FieldComponentOverrides;
  onFieldError?: (error: Error, fieldId?: string) => void;
  onEffect: (
    effect: FormEffect,
    state: { data: Record<string, unknown>; activeSectionId: string },
  ) => void | Promise<void>;
};

function FormRendererContent(props: FormRendererProps) {
  const sectionRef = useRef<HTMLFormElement>(null);
  const hasMountedRef = useRef(false);
  const [completed, setCompleted] = useState(props.initialCompleted ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const { t } = useI18n();
  const { pendingUploads } = useRendererApi();
  const { state, dispatch, prepare, commit } = useFormRuntime(
    props.definition,
    props.locale,
    props.initialData,
    props.initialSectionId,
  );

  useEffect(() => {
    setCompleted(props.initialCompleted ?? false);
    setSubmissionError(null);
  }, [props.definition, props.initialCompleted, props.initialSectionId]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    window.scrollTo(0, 0);
    sectionRef.current?.focus();
  }, [state.activeSectionId]);

  const activeSection = state.view.section;
  const components = createFieldComponentRegistry(props.components);

  if (!activeSection.id) {
    return null;
  }

  if (completed) {
    const completion = state.view.completion;
    const completionUrl = getSafeLink(completion?.button?.url);
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-semibold">
          <PlainText text={completion?.title ?? t('thank_you.default_title')} />
        </h2>
        <div className="text-muted-foreground">
          <PlainText
            text={completion?.message ?? t('thank_you.default_description')}
          />
        </div>
        {completionUrl ? (
          <Button asChild>
            <a href={completionUrl}>
              {completion?.button?.label || completionUrl}
            </a>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissionError ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {submissionError}
        </p>
      ) : null}
      <FormViewRenderer
        ref={sectionRef}
        key={state.activeSectionId}
        view={state.view}
        data={state.data}
        sectionHistory={state.sectionHistory}
        dispatch={dispatch}
        components={components}
        disabled={isSaving || pendingUploads > 0}
        onFieldError={props.onFieldError}
        onSubmit={async (sectionData: FieldValues) => {
          if (isSaving) {
            return;
          }

          setIsSaving(true);
          setSubmissionError(null);
          const prepared = prepare({
            type: 'submit_section',
            data: sectionData,
          });
          const effectResult = prepared.effect;

          if (effectResult.type === 'none') {
            commit(prepared.state);
            setIsSaving(false);
            return;
          }

          try {
            await props.onEffect(effectResult, {
              data: prepared.state.data,
              activeSectionId: prepared.state.activeSectionId,
            });
            commit(prepared.state);
            if (effectResult.type === 'complete') {
              setCompleted(true);
            }
          } catch {
            setSubmissionError(t('submission.save_failed'));
          } finally {
            setIsSaving(false);
          }
        }}
      />
    </div>
  );
}

function getSafeLink(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value, 'https://declarativeforms.invalid');
    return url.protocol === 'http:' || url.protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}

export function FormRenderer(props: FormRendererProps) {
  return (
    <RendererApiProvider
      apiBaseUrl={props.apiBaseUrl}
      formId={props.formId ?? props.definition.id}
    >
      <I18nProvider locale={props.locale}>
        <FormRendererContent {...props} />
      </I18nProvider>
    </RendererApiProvider>
  );
}

export const DeclarativeForm = FormRenderer;
