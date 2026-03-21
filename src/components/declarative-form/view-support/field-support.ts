import type {
  ControllerRenderProps,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";

import type { CompiledField, CompiledOption, ValidationRule } from "../runtime/types";

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

export function getNumericRuleValue(
  rules: ValidationRule[],
  type: "min_length" | "max_length"
): number | undefined {
  return findValidationRule(rules, type)?.value;
}

export function getNumericBound(
  rules: ValidationRule[],
  type: "min" | "max"
): number | undefined {
  const rule = findValidationRule(rules, type);
  return rule && typeof rule.value === "number" ? rule.value : undefined;
}

export function getFieldOptions(field: CompiledField): CompiledOption[] | undefined {
  return "options" in field ? field.options : undefined;
}
