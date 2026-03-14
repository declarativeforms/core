import { useEffect, useRef } from "react";
import type { FieldValues } from "react-hook-form";

import { useFormRuntime } from "../runtime/use-runtime";
import type { FormEffect } from "../runtime/types";
import { DeclarativeFormSection } from "./section.component";
import type { IDeclarativeForm } from "../types";

export function DeclarativeForm(props: {
  form: IDeclarativeForm;
  locale: string;
  initialData: FieldValues;
  initialSectionId?: string;
  onEffect: (effect: FormEffect, state: { data: Record<string, unknown>; activeSectionId: string }) => void;
}) {
  const sectionRef = useRef<HTMLFormElement>(null);
  const { state, dispatch } = useFormRuntime(
    props.form,
    props.locale,
    props.initialData,
    props.initialSectionId
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    sectionRef.current?.focus();
  }, [state.activeSectionId]);

  const activeSection = state.compiled.sections.find(
    (section) => section.id === state.activeSectionId
  );

  if (!activeSection) {
    return null;
  }

  return (
    <DeclarativeFormSection
      ref={sectionRef}
      key={state.activeSectionId}
      section={activeSection}
      data={state.data}
      sectionHistory={state.sectionHistory}
      dispatch={dispatch}
      onSubmit={(sectionData: FieldValues) => {
        const result = dispatch({
          type: "submit_section",
          data: sectionData,
        });

        if (result.type !== "none") {
          props.onEffect(result, {
            data: { ...state.data, ...sectionData },
            activeSectionId: result.activeSectionId,
          });
        }
      }}
    />
  );
}
