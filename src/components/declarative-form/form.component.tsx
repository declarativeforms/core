import mixpanel from "mixpanel-browser";
import { useEffect, useRef, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { isExternalNextSectionId, resolveNextSectionId } from "./form-helpers";
import { resolveSectionContent } from "./localized-content";
import { DeclarativeFormSection } from "./section.component";
import type { IDeclarativeForm } from "./types";
import { useI18n } from "@/i18n";

export function DeclarativeForm(props: {
  form: IDeclarativeForm;
  initialData: FieldValues;
  initialSectionId?: string;
  submissionId: string | null;
  onProgress?: (progress: { submissionId: string | null; step: string }) => void;
  onSubmit: (data: FieldValues, isPartial: boolean) => Promise<string | void>;
}) {
  const navigate = useNavigate();
  const { locale, withLang } = useI18n();
  const sectionRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<{
    activeSectionId: string;
    data: FieldValues;
  }>(() => ({
    activeSectionId: props.initialSectionId ?? props.form.sections[0].id,
    data: props.initialData,
  }));

  useEffect(() => {
    if (props.form.mixpanel) {
      mixpanel.init(props.form.mixpanel, {
        api_host: "https://api-eu.mixpanel.com",
      });

      mixpanel.track("page_view", {
        form_id: props.form.id,
      });
    }
  }, [props.form.mixpanel, props.form.id, props.form.title]);

  useEffect(() => {
    window.scrollTo(0, 0);
    sectionRef.current?.focus();
  }, [state.activeSectionId]);

  const activeSection = props.form.sections.find(
    (section) => section.id === state.activeSectionId
  );

  if (!activeSection) {
    return null;
  }

  const resolvedActiveSection = resolveSectionContent(activeSection, locale);

  return (
    <DeclarativeFormSection
      ref={sectionRef}
      key={state.activeSectionId}
      data={state.data}
      section={resolvedActiveSection}
      onSubmit={async (x: FieldValues) => {
        const result = { ...state.data, ...x };
        setState((currentState) => ({
          ...currentState,
          data: result,
        }));

        if (props.form.mixpanel) {
          mixpanel.track("section_completed", {
            form_id: props.form.id,
            section_id: state.activeSectionId,
          });
        }

        const currentSection = props.form.sections.find(
          (section) => section.id === state.activeSectionId
        );

        if (!currentSection) {
          return;
        }

        const nextSectionId = resolveNextSectionId(currentSection, result);

        if (isExternalNextSectionId(nextSectionId)) {
          const id = await props.onSubmit(result, false);
          props.onProgress?.({
            submissionId: id ?? props.submissionId,
            step: "done",
          });

          window.location.href = nextSectionId;

          return;
        }

        if (nextSectionId === "done") {
          const id = await props.onSubmit(result, false);

          const submissionId = id ?? props.submissionId;
          props.onProgress?.({
            submissionId,
            step: "done",
          });

          navigate(
            withLang(
              submissionId
                ? `thank-you?submission_id=${submissionId}`
                : "thank-you"
            )
          );

          return;
        }

        const id = await props.onSubmit(result, true);
        props.onProgress?.({
          submissionId: id ?? props.submissionId,
          step: nextSectionId,
        });

        setState((currentState) => ({
          ...currentState,
          activeSectionId: nextSectionId,
        }));
      }}
    />
  );
}
