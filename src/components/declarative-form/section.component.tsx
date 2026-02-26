import type { Ref } from "react";
import { FormProvider, useForm, type FieldValues } from "react-hook-form";

import { Button } from "../ui";
import { AccumulatedDataContext } from "./accumulated-data-context";
import { DeclarativeFormField } from "./field.component";
import type {
  IResolvedDeclarativeFormField,
  IResolvedDeclarativeFormSection,
} from "./localized-content";
import { useI18n } from "@/i18n";

export function DeclarativeFormSection(props: {
  ref?: Ref<HTMLFormElement>;
  data: FieldValues;
  section: IResolvedDeclarativeFormSection;
  onSubmit: (data: FieldValues) => void | Promise<void>;
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
      <AccumulatedDataContext.Provider value={props.data}>
        <form
          ref={props.ref}
          tabIndex={-1}
          aria-label={props.section.title || undefined}
          onSubmit={handleSubmit}
          className="outline-none"
        >
          <div className="space-y-6">
            {props.section.fields.map((field: IResolvedDeclarativeFormField) => (
              <DeclarativeFormField key={field.id} field={field} form={form} />
            ))}
          </div>

          <div className="mt-8 flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              disabled={form.formState.isSubmitting}
            >
              {t("section.back")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {t("section.next")}
            </Button>
          </div>
        </form>
      </AccumulatedDataContext.Provider>
    </FormProvider>
  );
}
