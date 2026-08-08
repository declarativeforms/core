import { useEffect, useRef } from 'react';
import type { FieldValues } from 'react-hook-form';

import type { IDeclarativeForm } from '@declarativeforms/engine';
import { DeclarativeFormSection } from './section.component';
import { useDeclarativeForm, type FormEffect } from './use-declarative-form';

export function DeclarativeForm(props: {
  form: IDeclarativeForm;
  locale: string;
  initialData: FieldValues;
  initialSectionId?: string;
  onEffect: (
    effect: FormEffect,
    state: { data: Record<string, unknown>; activeSectionId: string },
  ) => void | Promise<void>;
}) {
  const sectionRef = useRef<HTMLFormElement>(null);
  const hasMountedRef = useRef(false);
  // TODO: don't deconstruct the variable, name it and then use it such as declarativeForm.section.
  const { section, activeSectionId, data, goBack, submitSection } =
    useDeclarativeForm(
      props.form,
      props.locale,
      props.initialData,
      props.initialSectionId,
    );

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    window.scrollTo(0, 0);
    sectionRef.current?.focus();
  }, [activeSectionId]);

  if (!section) {
    return null;
  }

  return (
    <DeclarativeFormSection
      ref={sectionRef}
      key={activeSectionId}
      section={section}
      data={data}
      onBack={goBack}
      onSubmit={async (sectionData: FieldValues) => {
        const result = submitSection(sectionData);
        await props.onEffect(result, {
          data: result.data,
          activeSectionId: result.activeSectionId,
        });
      }}
    />
  );
}
