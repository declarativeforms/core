import { forwardRef } from "react";
import { FormProvider, useForm, type FieldValues } from "react-hook-form";

import { Button } from "../../ui";
import { useI18n } from "@/i18n";
import type { CompiledSection, FormAction } from "../runtime/types";
import { DeclarativeFormField } from "./field.component";

type DeclarativeFormSectionProps = {
  section: CompiledSection;
  data: Record<string, unknown>;
  sectionHistory: string[];
  dispatch: (action: FormAction) => void;
  onSubmit: (sectionData: FieldValues) => void;
};

function buildDefaultValues(
  section: CompiledSection,
  data: Record<string, unknown>
): FieldValues {
  return section.fields.reduce((acc, field) => {
    acc[field.id] = data[field.id] || "";
    return acc;
  }, {} as FieldValues);
}

export const DeclarativeFormSection = forwardRef<
  HTMLFormElement,
  DeclarativeFormSectionProps
>(function DeclarativeFormSection(props, ref) {
  const { t } = useI18n();
  const form = useForm({
    defaultValues: buildDefaultValues(props.section, props.data),
  });

  const handleSubmit = form.handleSubmit(
    (data: FieldValues) => props.onSubmit(data),
    (errors) => {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        form.setFocus(firstErrorField);
      }
    }
  );

  return (
    <FormProvider {...form}>
      <form
        ref={ref}
        tabIndex={-1}
        aria-label={props.section.title || undefined}
        onSubmit={handleSubmit}
        className="outline-none"
      >
        <div className="space-y-6">
          {props.section.fields.map((field) => (
            <DeclarativeFormField key={field.id} field={field} form={form} />
          ))}
        </div>

        <div className="mt-8 flex justify-between items-center">
          {props.sectionHistory.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              disabled={form.formState.isSubmitting}
              onClick={() => props.dispatch({ type: "go_back" })}
            >
              {t("section.back")}
            </Button>
          ) : (
            <div />
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {t("section.next")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
});
