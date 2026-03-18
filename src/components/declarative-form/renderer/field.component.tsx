import {
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

import { FormField, FormItem, FormLabel, FormMessage } from "../../ui";
import { useI18n } from "@/i18n";
import type { CompiledField } from "../runtime/types";
import { HtmlText } from "../view-support/html-text";
import { FieldErrorBoundary } from "./field-error-boundary.component";
import { fieldRegistry } from "./field-registry";
import { validationRulesToRegisterOptions } from "./field-validation";

function FieldLabel({ field }: { field: CompiledField }) {
  return (
    <FormLabel className="text-sm/4.5">
      <HtmlText html={field.label} />
      {field.required ? (
        <span className="font-medium text-red-500" aria-hidden="true">
          *
        </span>
      ) : null}
    </FormLabel>
  );
}

export function DeclarativeFormField(props: {
  field: CompiledField;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
}) {
  const { t } = useI18n();

  if (!props.field.visible) {
    return null;
  }

  const compiledField = props.field;
  const rules = validationRulesToRegisterOptions(compiledField, {
    emailOtpRequired: t("validation.email_otp_required"),
    emailFreeEmailBlocked: t("validation.email_free_blocked"),
  });
  const Renderer = fieldRegistry[compiledField.type];
  if (!Renderer) {
    return null;
  }
  const isHiddenField = compiledField.type === "hidden";

  return (
    <FormField
      control={props.form.control}
      name={compiledField.id}
      rules={rules}
      render={({ field }) =>
        isHiddenField ? (
          <FieldErrorBoundary fieldId={compiledField.id}>
            <Renderer
              controllerField={field}
              field={compiledField}
              form={props.form}
            />
          </FieldErrorBoundary>
        ) : (
          <FormItem>
            <FieldLabel field={compiledField} />
            <FieldErrorBoundary fieldId={compiledField.id}>
              <Renderer
                controllerField={field}
                field={compiledField}
                form={props.form}
              />
            </FieldErrorBoundary>
            <FormMessage />
          </FormItem>
        )
      }
    />
  );
}
