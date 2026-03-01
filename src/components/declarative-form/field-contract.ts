import type { ControllerRenderProps, FieldValues, UseFormReturn } from "react-hook-form";

import type { CompiledField, ValidationRule } from "./runtime/types";

export type FieldMinValidator = { value: number | string; message: string };
export type FieldMaxValidator = { value: number | string; message: string };

export type DeclarativeFieldMeta = {
  hasPatternValidator: boolean;
  isRequired: boolean;
  maxValidator?: FieldMaxValidator;
  minValidator?: FieldMinValidator;
};

export type DeclarativeFieldComponentProps = {
  controllerField: ControllerRenderProps<FieldValues, string>;
  field: CompiledField;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
  meta: DeclarativeFieldMeta;
};

export function getFieldMeta(field: CompiledField): DeclarativeFieldMeta {
  const minRule = field.validation.find(
    (r): r is Extract<ValidationRule, { type: "min" | "min_length" }> =>
      r.type === "min" || r.type === "min_length"
  );
  const maxRule = field.validation.find(
    (r): r is Extract<ValidationRule, { type: "max" | "max_length" }> =>
      r.type === "max" || r.type === "max_length"
  );

  return {
    hasPatternValidator: field.validation.some((r) => r.type === "pattern"),
    isRequired: field.validation.some((r) => r.type === "required"),
    minValidator: minRule
      ? { value: minRule.value, message: minRule.message }
      : undefined,
    maxValidator: maxRule
      ? { value: maxRule.value, message: maxRule.message }
      : undefined,
  };
}
