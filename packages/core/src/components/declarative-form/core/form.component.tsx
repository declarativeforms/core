import { useEffect, useRef } from 'react';
import type { FieldValues } from 'react-hook-form';

import type { IDeclarativeForm } from '@declarativeforms/engine';
import { DeclarativeFormSection } from './section.component';
import { useDeclarativeForm } from './use-declarative-form';
import type { FormEffect } from './use-declarative-form.types';

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
  const declarativeForm = useDeclarativeForm(
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
  }, [declarativeForm.activeSectionId]);

  if (!declarativeForm.section) {
    return null;
  }

  return (
    <DeclarativeFormSection
      ref={sectionRef}
      key={declarativeForm.activeSectionId}
      section={declarativeForm.section}
      data={declarativeForm.data}
      onBack={declarativeForm.goBack}
      onSubmit={async (sectionData: FieldValues) => {
        const result = declarativeForm.submitSection(sectionData);
        await props.onEffect(result, {
          data: result.data,
          activeSectionId: result.activeSectionId,
        });
      }}
    />
  );
}
