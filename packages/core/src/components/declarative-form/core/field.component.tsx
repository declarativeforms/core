import { useEffect } from "react";
import {
  Controller,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

import { Field, FieldLabel as BaseFieldLabel, FieldError } from "../../ui";
import { useI18n } from "@/i18n";
import type { CompiledField } from "@declarativeforms/runtime";
import { buildFieldValidation } from "../supporting/validation";
import { HtmlText } from "../supporting/html-text";
import { FieldErrorBoundary } from "../supporting/field-error-boundary.component";
import { fieldRegistry } from "./field-registry";

function FieldLabel({ field }: { field: CompiledField }) {
  return (
    <BaseFieldLabel className="text-sm/4.5">
      <HtmlText html={field.label} />
      {field.required ? (
        <span className="font-medium text-red-500" aria-hidden="true">
          *
        </span>
      ) : null}
    </BaseFieldLabel>
  );
}

export function DeclarativeFormField(props: {
  field: CompiledField;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
}) {
  const { t } = useI18n();
  const { visible, id } = props.field;

  useEffect(() => {
    if (!visible) {
      props.form.unregister(id);
    }
  }, [visible, id, props.form]);

  if (!visible) {
    return null;
  }

  const compiledField = props.field;
  const { registerOptions: rules } = buildFieldValidation(compiledField, {
    emailOtpRequired: t("validation.email_otp_required"),
    emailFreeEmailBlocked: t("validation.email_free_blocked"),
  });
  const Renderer = fieldRegistry[compiledField.type];
  if (!Renderer) {
    return null;
  }
  const isHiddenField = compiledField.type === "hidden";

  return (
    <Controller
      control={props.form.control}
      name={compiledField.id}
      rules={rules}
      render={({ field, fieldState }) =>
        isHiddenField ? (
          <FieldErrorBoundary fieldId={compiledField.id}>
            <Renderer
              controllerField={field}
              field={compiledField}
              form={props.form}
            />
          </FieldErrorBoundary>
        ) : (
          <Field>
            <FieldLabel field={compiledField} />
            <FieldErrorBoundary fieldId={compiledField.id}>
              <Renderer
                controllerField={field}
                field={compiledField}
                form={props.form}
              />
            </FieldErrorBoundary>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )
      }
    />
  );
}
