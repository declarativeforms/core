import { useEffect, useRef } from "react";
import type { FieldValues } from "react-hook-form";

import { useFormRuntime } from "./use-runtime";
import type { FormEffect } from "@declarativeforms/runtime";
import { DeclarativeFormSection } from "./section.component";
import type { IDeclarativeForm } from "../supporting/types";

export function DeclarativeForm(props: {
  form: IDeclarativeForm;
  locale: string;
  initialData: FieldValues;
  initialSectionId?: string;
  onEffect: (effect: FormEffect, state: { data: Record<string, unknown>; activeSectionId: string }) => void | Promise<void>;
}) {
  const sectionRef = useRef<HTMLFormElement>(null);
  const hasMountedRef = useRef(false);
  const { state, dispatch } = useFormRuntime(
    props.form,
    props.locale,
    props.initialData,
    props.initialSectionId
  );

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    window.scrollTo(0, 0);
    sectionRef.current?.focus();
  }, [state.activeSectionId]);

  const activeSection = state.compiled.sections.find(
    (section) => section.id === state.activeSectionId
  );
  const activeSectionIndex = state.compiled.sections.findIndex(
    (section) => section.id === state.activeSectionId
  );
  const showProgress = state.compiled.sections.length > 1 && activeSectionIndex >= 0;
  const progressWidth = showProgress
    ? `${((activeSectionIndex + 1) / state.compiled.sections.length) * 100}%`
    : "0%";

  if (!activeSection) {
    return null;
  }

  return (
    <div className="space-y-5">
      {showProgress ? (
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-muted/70"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-primary/35 transition-[width] duration-300 ease-out"
            style={{ width: progressWidth }}
          />
        </div>
      ) : null}

      <DeclarativeFormSection
        ref={sectionRef}
        key={state.activeSectionId}
        section={activeSection}
        data={state.data}
        sectionHistory={state.sectionHistory}
        dispatch={dispatch}
        onSubmit={async (sectionData: FieldValues) => {
          const result = dispatch({
            type: "submit_section",
            data: sectionData,
          });

          if (result.type !== "none") {
            await props.onEffect(result, {
              data: { ...state.data, ...sectionData },
              activeSectionId: result.activeSectionId,
            });
          }
        }}
      />
    </div>
  );
}
