'use client';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  compile,
  render,
  type IResolvedFormField,
  type IRenderableSection,
} from '@declarativeforms/engine';
import { SectionLoading } from '@/components/declarative-form/supporting';
import { Button } from '@/components/ui';
import { useI18n } from '@/i18n';
import { assessAdaptiveSection } from '@/lib/adaptive';
import { DeclarativeFormSection } from './section.component';

export function AdaptiveSection(props: {
  formId: string;
  section: IRenderableSection;
  locale: string;
  data: Record<string, unknown>;
  onBack: () => void;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
}): React.JSX.Element {
  const i18n = useI18n();
  const [context] = useState(props.data);
  const [assessment, setAssessment] =
    useState<Awaited<ReturnType<typeof assessAdaptiveSection>>>();
  const [turn, setTurn] = useState(0);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  const sectionRef = useRef<HTMLFormElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const runningRef = useRef(false);
  const historyRef = useRef<
    Array<{
      fields: Array<IResolvedFormField>;
      answers: Record<string, unknown>;
    }>
  >([]);

  async function advance(answers?: Record<string, unknown>): Promise<void> {
    if (runningRef.current) {
      return;
    }

    runningRef.current = true;
    setBusy(true);
    setFailed(false);
    const controller = controllerRef.current ?? new AbortController();
    controllerRef.current = controller;
    if (answers && assessment) {
      historyRef.current = [
        ...historyRef.current,
        { fields: assessment.fields, answers },
      ];
    }

    try {
      const current =
        assessment?.outputs !== undefined
          ? assessment
          : await assessAdaptiveSection(
              props.formId,
              props.section.id,
              {
                locale: props.locale,
                data: context,
                history: historyRef.current,
              },
              controller.signal,
            );
      controller.signal.throwIfAborted();
      setAssessment(current);
      setTurn(historyRef.current.length);

      if (current.outputs !== undefined) {
        await props.onSubmit(
          Object.fromEntries(
            Object.keys(props.section.adaptive?.properties ?? {}).map((key) => [
              key,
              current.outputs![key],
            ]),
          ),
        );
      }
    } catch {
      if (!controller.signal.aborted) {
        setFailed(true);
      }
    } finally {
      if (!controller.signal.aborted) {
        runningRef.current = false;
        setBusy(false);
      }
    }
  }

  const initialize = useEffectEvent(() => void advance());

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        initialize();
      }
    });

    return () => {
      active = false;
      controllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!busy && assessment && assessment.outputs === undefined) {
      sectionRef.current?.focus();
    }
  }, [busy, assessment]);

  const generated =
    assessment && assessment.outputs === undefined
      ? render(
          compile(
            {
              sections: [{ id: props.section.id, fields: assessment.fields }],
            },
            {},
          ),
          {},
          { sectionId: props.section.id },
        ).section
      : undefined;

  return (
    <>
      {busy ? <SectionLoading /> : null}
      {failed ? (
        <div
          role="alert"
          className="px-6 py-4 space-y-3 text-sm/5 text-destructive"
        >
          <p>{i18n.t('adaptive.failed')}</p>
          <Button type="button" disabled={busy} onClick={() => void advance()}>
            {i18n.t('adaptive.retry')}
          </Button>
        </div>
      ) : null}
      {generated ? (
        <div hidden={busy} className="space-y-6">
          <DeclarativeFormSection
            key={turn}
            ref={sectionRef}
            formId={props.formId}
            section={{
              ...props.section,
              fields: generated.fields,
              defaultValues: generated.defaultValues,
            }}
            data={{}}
            disabled={busy || failed}
            onBack={props.onBack}
            onSubmit={advance}
          />
        </div>
      ) : !busy && props.section.canGoBack ? (
        <Button type="button" variant="outline" onClick={props.onBack}>
          {i18n.t('section.back')}
        </Button>
      ) : null}
    </>
  );
}
