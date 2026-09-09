'use client';
import { useEffect, useRef } from 'react';
import type { FieldValues } from 'react-hook-form';
import type { IDeclarativeForm } from '@declarativeforms/engine';
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
}) {
  const sectionRef = useRef<HTMLFormElement>(null);
  const hasMountedRef = useRef(false);
  const declarativeForm = useDeclarativeForm(
    props.form,
    props.locale,
    props.initialData,
    props.sectionId,
  );

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;

      return;
    }
    window.scrollTo(0, 0);
    sectionRef.current?.focus({ preventScroll: true });
  }, [props.sectionId]);

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

  return (
    <DeclarativeFormSection
      ref={sectionRef}
      key={declarativeForm.section.id}
      formId={props.form.id ?? ''}
      section={declarativeForm.section}
      data={declarativeForm.data}
      onBack={() => props.onStepChange(declarativeForm.goBack())}
      onSubmit={async (sectionData: FieldValues) => {
        const completedSectionId = declarativeForm.section?.id ?? '';
        const result = declarativeForm.submitSection(sectionData);

        if (result.type === 'submit') {
          props.onStepChange(result.activeSectionId);
        }

        await props.onEffect(result, {
          data: result.data,
          activeSectionId: result.activeSectionId,
          completedSectionId,
        });
      }}
    />
  );
}
