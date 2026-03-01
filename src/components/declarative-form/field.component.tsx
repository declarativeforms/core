import {
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

import { FormField, FormItem, FormLabel, FormMessage } from "../ui";
import { FieldErrorBoundary } from "./field-error-boundary.component";
import { getFieldMeta } from "./field-contract";
import { declarativeFieldRenderers } from "./field-renderers";
import { validationRulesToRegisterOptions } from "./field-validation";
import type { CompiledField } from "./runtime/types";

export function DeclarativeFormField(props: {
  field: CompiledField;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
}) {
  if (!props.field.visible) {
    return null;
  }

  const compiledField = props.field;
  const meta = getFieldMeta(compiledField);
  const rules = validationRulesToRegisterOptions(compiledField, meta);
  const Renderer = declarativeFieldRenderers[compiledField.type];
  const isHiddenField = compiledField.type === "hidden";

  const Label = () => (
    <FormLabel className="text-sm/4.5">
      {compiledField.label}
      {meta.isRequired && (
        <span
          className="font-medium text-red-500"
          aria-hidden="true"
        >
          *
        </span>
      )}
    </FormLabel>
  );

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
              meta={meta}
            />
          </FieldErrorBoundary>
        ) : (
          <FormItem>
            {Label()}
            <FieldErrorBoundary fieldId={compiledField.id}>
              <Renderer
                controllerField={field}
                field={compiledField}
                form={props.form}
                meta={meta}
              />
            </FieldErrorBoundary>
            <FormMessage />
          </FormItem>
        )
      }
    />
  );
}
