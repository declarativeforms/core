import type {
  ControllerRenderProps,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";

import type { CompiledField, ValidationRule } from "../runtime/types";

export type DeclarativeFieldComponentProps = {
  controllerField: ControllerRenderProps<FieldValues, string>;
  field: CompiledField;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
};

export function findValidationRule<T extends ValidationRule["type"]>(
  rules: ValidationRule[],
  type: T
): Extract<ValidationRule, { type: T }> | undefined {
  return rules.find(
    (rule): rule is Extract<ValidationRule, { type: T }> => rule.type === type
  );
}
