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
  sectionId: string,
): UseDeclarativeForm {
  const [data, setData] = useState(initialData);

  const resolved = useMemo(() => resolve(schema, locale), [schema, locale]);

  const renderableFormFn = useCallback(
    (answers: Record<string, unknown>): IRenderableForm | null => {
      const compiled = compile(resolved, answers);

      return compiled.sections.length
        ? render(compiled, answers, { sectionId })
        : null;
    },
    [resolved, sectionId],
  );

  const renderable = useMemo(
    () => renderableFormFn(data),
    [renderableFormFn, data],
  );

  const submitSection = useCallback(
    (sectionData: Record<string, unknown>): SubmitResult => {
      const merged = { ...data, ...sectionData };

      const next = renderableFormFn(merged)?.section.next;

      setData(merged);

      if (next?.type === 'redirect') {
        return {
          type: 'redirect',
          url: next.url,
          activeSectionId: renderable?.section.id ?? '',
          data: merged,
        };
      }

      if (!next || next.type === 'complete') {
        return {
          type: 'complete',
          data: merged,
          activeSectionId: renderable?.section.id ?? '',
        };
      }

      return {
        type: 'submit',
        data: merged,
        isPartial: true,
        activeSectionId: next.sectionId,
      };
    },
    [data, renderable, renderableFormFn],
  );

  const goBack = useCallback((): string => {
    const previous = findPreviousSectionId(
      compile(resolved, data),
      renderable?.section.id ?? '',
    );

    return previous ?? '';
  }, [resolved, data, renderable]);

  return {
    start: renderable?.start,
    section: renderable?.section,
    data,
    submitSection,
    goBack,
  };
}
