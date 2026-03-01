import type { Ref } from "react";
import { FormProvider, useForm, type FieldValues } from "react-hook-form";

import { Button } from "../ui";
import { DeclarativeFormField } from "./field.component";
import type { CompiledField, CompiledSection, FormAction } from "./runtime/types";
import { useI18n } from "@/i18n";

export function DeclarativeFormSection(props: {
  ref?: Ref<HTMLFormElement>;
  section: CompiledSection;
  data: Record<string, unknown>;
  sectionHistory: string[];
  dispatch: (action: FormAction) => void;
  onSubmit: (sectionData: FieldValues) => void;
}) {
  const { t } = useI18n();
  const form = useForm({
    defaultValues: props.section.fields.reduce((acc, field) => {
      acc[field.id] = props.data[field.id] || "";

      return acc;
    }, {} as FieldValues),
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
        ref={props.ref}
        tabIndex={-1}
        aria-label={props.section.title || undefined}
        onSubmit={handleSubmit}
        className="outline-none"
      >
        <div className="space-y-6">
          {props.section.fields.map((field: CompiledField) => (
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
}
