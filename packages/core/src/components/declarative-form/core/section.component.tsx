'use client';

import { forwardRef } from "react";
import { useForm, useWatch, type FieldValues } from "react-hook-form";

import {
  evaluateExpression,
  type IRenderableSection,
} from "@declarativeforms/engine";
import { Button } from "../../ui";
import { useI18n } from "@/i18n";
import { DeclarativeFormField } from "./field.component";

export const DeclarativeFormSection = forwardRef<
  HTMLFormElement,
  {
    section: IRenderableSection;
    data: Record<string, unknown>;
    onBack: () => void;
    onSubmit: (sectionData: FieldValues) => void | Promise<void>;
  }
>(function DeclarativeFormSection(props, ref) {
  const { t } = useI18n();
  const form = useForm({ defaultValues: props.section.defaultValues });

  const values = useWatch({ control: form.control });

  const allValues = { ...props.data, ...(values ?? {}) };

  const fields = props.section.fields.map((field) =>
    field.visibleWhen
      ? { ...field, visible: evaluateExpression(field.visibleWhen, allValues) }
      : field,
  );

  return (
    <form
      ref={ref}
      tabIndex={-1}
      aria-label={props.section.title || undefined}
      onSubmit={form.handleSubmit(
        (data: FieldValues) => props.onSubmit(data),
        (errors) => {
          const firstErrorField = Object.keys(errors)[0];
          if (firstErrorField) {
            form.setFocus(firstErrorField);
          }
        },
      )}
      noValidate
      className="outline-none"
    >
      <div className="space-y-6">
        {fields.map((field) => (
          <DeclarativeFormField key={field.id} field={field} form={form} />
        ))}
      </div>

      <div className="mt-8 flex justify-between items-center">
        {props.section.canGoBack ? (
          <Button
            type="button"
            variant="outline"
            disabled={form.formState.isSubmitting}
            onClick={props.onBack}
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
  );
});
