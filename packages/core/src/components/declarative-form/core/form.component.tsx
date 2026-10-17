'use client';
import { useEffect, useRef } from 'react';
import type { FieldValues } from 'react-hook-form';
import type { IDeclarativeForm } from '@declarativeforms/engine';
import { focusForm } from '@/lib/focus-form';
import { AdaptiveSection } from './adaptive-section.component';
import { DeclarativeFormSection } from './section.component';
import { DeclarativeFormStart } from './start.component';
import { useDeclarativeForm } from './use-declarative-form';
import type { FormEffect } from './use-declarative-form.types';

export function DeclarativeForm(props: {
  form: IDeclarativeForm;
  locale: string;
  initialData: FieldValues;
  sectionId: string;
  onStepChange: (sectionId: string) => void;
  onEffect: (
    effect: FormEffect,
    state: {
      data: Record<string, unknown>;
      activeSectionId: string;
      completedSectionId: string;
    },
  ) => void | Promise<void>;
}): React.JSX.Element | null {
  const sectionRef = useRef<HTMLFormElement>(null);
  const previousSectionIdRef = useRef(props.sectionId);
  const declarativeForm = useDeclarativeForm(
    props.form,
    props.locale,
    props.sectionId,
    props.initialData,
  );
  const isAdaptive = !!declarativeForm.section?.adaptive;

  useEffect(() => {
    if (previousSectionIdRef.current === props.sectionId) {
      return;
    }

    previousSectionIdRef.current = props.sectionId;

    if (isAdaptive && props.sectionId) {
      return;
    }

    return focusForm(sectionRef.current);
  }, [props.sectionId, isAdaptive]);

  if (!declarativeForm.section) {
    return null;
  }

  if (!props.sectionId && declarativeForm.start) {
    return (
      <DeclarativeFormStart
        start={declarativeForm.start}
        onBegin={() => props.onStepChange(declarativeForm.section?.id ?? '')}
      />
    );
  }

  async function submitSection(sectionData: FieldValues): Promise<void> {
    const completedSectionId = declarativeForm.section?.id ?? '';
    const transition = declarativeForm.submitSection(sectionData);

    await props.onEffect(transition, {
      data: transition.data,
      activeSectionId: transition.activeSectionId,
      completedSectionId,
    });
  }

  if (declarativeForm.section.adaptive) {
    return (
      <AdaptiveSection
        key={`${declarativeForm.section.id}:${props.locale}`}
        formId={props.form.id ?? ''}
        section={declarativeForm.section}
        locale={props.locale}
        data={declarativeForm.data}
        onBack={() => props.onStepChange(declarativeForm.goBack())}
        onSubmit={submitSection}
      />
    );
  }

  return (
    <DeclarativeFormSection
      ref={sectionRef}
      key={declarativeForm.section.id}
      formId={props.form.id ?? ''}
      section={declarativeForm.section}
      data={declarativeForm.data}
      onBack={() => props.onStepChange(declarativeForm.goBack())}
      onSubmit={submitSection}
    />
  );
}
