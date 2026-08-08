import { useCallback, useMemo, useState } from 'react';

import {
  compile,
  render,
  resolve,
  type IDeclarativeForm,
  type IRenderableForm,
  type IRenderableSection,
} from '@declarativeforms/engine';

// TODO: move these types into their own file
export type FormEffect =
  | { type: 'submit'; data: Record<string, unknown>; isPartial: boolean }
  | { type: 'complete'; data: Record<string, unknown> }
  | { type: 'redirect'; url: string };

// TODO: move these types into their own file
export type SubmitResult = FormEffect & {
  activeSectionId: string;
  data: Record<string, unknown>;
};

// TODO: move these types into their own file
export type UseDeclarativeForm = {
  section: IRenderableSection | undefined;
  data: Record<string, unknown>;
  activeSectionId: string;
  submitSection: (sectionData: Record<string, unknown>) => SubmitResult;
  goBack: () => void;
};

// TODO: move these types into their own file
type FormProgress = {
  data: Record<string, unknown>;
  activeSectionId: string;
  history: string[];
};

/**
 * Owns the form's answers + navigation and drives the engine pipeline
 * (`resolve` once per schema+locale, `compile`/`render` per committed change).
 * The engine is pure; this hook is the app-level state it needs.
 */
export function useDeclarativeForm(
  schema: IDeclarativeForm,
  locale: string,
  initialData: Record<string, unknown>,
  initialSectionId?: string,
): UseDeclarativeForm {
  // TODO: remove the progress feature completely from this project in all aspects.
  const [progress, setProgress] = useState<FormProgress>(() => ({
    data: initialData,
    activeSectionId: initialSectionId ?? schema.sections?.[0]?.id ?? '',
    history: [],
  }));

  const resolved = useMemo(() => resolve(schema, locale), [schema, locale]);
  // TODO: we should be able to remove history property which means we only need to track the activeSectionId
  const navContext = useMemo(
    () => ({ sectionId: progress.activeSectionId, history: progress.history }),
    [progress.activeSectionId, progress.history],
  );

  // TODO: rename this variable to be closer to what it is such as `renderableFormFn`
  const renderFor = useCallback(
    (answers: Record<string, unknown>): IRenderableForm | null => {
      const compiled = compile(resolved, answers);
      return compiled.sections.length
        ? render(compiled, answers, navContext)
        : null;
    },
    [resolved, navContext],
  );

  const section = useMemo(
    () => renderFor(progress.data)?.section,
    [renderFor, progress.data],
  );

  const submitSection = useCallback(
    (sectionData: Record<string, unknown>): SubmitResult => {
      const data = { ...progress.data, ...sectionData };
      const { activeSectionId } = progress;
      // Navigation is resolved against the just-submitted answers.
      const next = renderFor(data)?.section.next;

      if (next?.type === 'redirect') {
        setProgress((p) => ({ ...p, data }));
        return { type: 'redirect', url: next.url, activeSectionId, data };
      }
      if (!next || next.type === 'complete') {
        setProgress((p) => ({ ...p, data }));
        return { type: 'complete', data, activeSectionId };
      }
      setProgress((p) => ({
        data,
        activeSectionId: next.sectionId,
        history: [...p.history, activeSectionId],
      }));
      return {
        type: 'submit',
        data,
        isPartial: true,
        activeSectionId: next.sectionId,
      };
    },
    [progress, renderFor],
  );

  const goBack = useCallback(() => {
    setProgress((p) => {
      const previous = p.history[p.history.length - 1];
      return previous
        ? { ...p, activeSectionId: previous, history: p.history.slice(0, -1) }
        : p;
    });
  }, []);

  return {
    section,
    data: progress.data,
    activeSectionId: progress.activeSectionId,
    submitSection,
    goBack,
  };
}
