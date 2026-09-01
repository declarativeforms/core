'use client';
import { useCallback, useMemo, useState } from 'react';
import {
  compile,
  findPreviousSectionId,
  render,
  resolve,
  type IDeclarativeForm,
  type IRenderableForm,
} from '@declarativeforms/engine';
import type {
  SubmitResult,
  UseDeclarativeForm,
} from './use-declarative-form.types';

export function useDeclarativeForm(
  schema: IDeclarativeForm,
  locale: string,
  initialData: Record<string, unknown>,
  initialSectionId?: string,
): UseDeclarativeForm {
  const [formState, setFormState] = useState(() => ({
    data: initialData,
    activeSectionId: initialSectionId ?? schema.sections?.[0]?.id ?? '',
  }));

  const resolved = useMemo(() => resolve(schema, locale), [schema, locale]);

  const renderableFormFn = useCallback(
    (answers: Record<string, unknown>): IRenderableForm | null => {
      const compiled = compile(resolved, answers);

      return compiled.sections.length
        ? render(compiled, answers, { sectionId: formState.activeSectionId })
        : null;
    },
    [resolved, formState.activeSectionId],
  );

  const section = useMemo(
    () => renderableFormFn(formState.data)?.section,
    [renderableFormFn, formState.data],
  );

  const submitSection = useCallback(
    (sectionData: Record<string, unknown>): SubmitResult => {
      const data = { ...formState.data, ...sectionData };

      const next = renderableFormFn(data)?.section.next;

      if (next?.type === 'redirect') {
        setFormState((state) => ({ ...state, data }));

        return {
          type: 'redirect',
          url: next.url,
          activeSectionId: formState.activeSectionId,
          data,
        };
      }
      if (!next || next.type === 'complete') {
        setFormState((state) => ({ ...state, data }));

        return {
          type: 'complete',
          data,
          activeSectionId: formState.activeSectionId,
        };
      }

      setFormState({ data, activeSectionId: next.sectionId });

      return {
        type: 'submit',
        data,
        isPartial: true,
        activeSectionId: next.sectionId,
      };
    },
    [formState, renderableFormFn],
  );

  const goBack = useCallback(() => {
    setFormState((state) => {
      const previous = findPreviousSectionId(
        compile(resolved, state.data),
        state.activeSectionId,
      );

      return previous ? { ...state, activeSectionId: previous } : state;
    });
  }, [resolved]);

  return {
    section,
    data: formState.data,
    activeSectionId: formState.activeSectionId,
    submitSection,
    goBack,
  };
}
