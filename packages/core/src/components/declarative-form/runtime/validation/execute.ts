import { evaluateValidationExpression } from "../core/expression";
import type { ValidationRule } from "../types";

function getSelectionCount(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }

  return value ? 1 : 0;
}

const ruleHandlers: {
  [K in ValidationRule["type"]]: (
    rule: Extract<ValidationRule, { type: K }>,
    context: {
      fieldType: string;
      value: unknown;
      data: Record<string, unknown>;
    }
  ) => string | undefined;
} = {
  required: () => undefined,
  pattern: (rule, { value }) =>
    new RegExp(rule.regex).test(String(value)) ? undefined : rule.message,
  min_length: (rule, { value }) =>
    String(value).length < rule.value ? rule.message : undefined,
  max_length: (rule, { value }) =>
    String(value).length > rule.value ? rule.message : undefined,
  min: (rule, { fieldType, value }) => {
    if (fieldType === "file_upload" || fieldType === "multiple_select") {
      return getSelectionCount(value) < Number(rule.value)
        ? rule.message
        : undefined;
    }

    if (fieldType === "number" || fieldType === "rating") {
      const numValue = Number(value);
      return Number.isFinite(numValue) && numValue < Number(rule.value)
        ? rule.message
        : undefined;
    }

    return String(value) < String(rule.value) ? rule.message : undefined;
  },
  max: (rule, { fieldType, value }) => {
    if (fieldType === "file_upload" || fieldType === "multiple_select") {
      return getSelectionCount(value) > Number(rule.value)
        ? rule.message
        : undefined;
    }

    if (fieldType === "number" || fieldType === "rating") {
      const numValue = Number(value);
      return Number.isFinite(numValue) && numValue > Number(rule.value)
        ? rule.message
        : undefined;
    }

    return String(value) > String(rule.value) ? rule.message : undefined;
  },
  expression: (rule, { data }) =>
    evaluateValidationExpression(rule.expression, data)
      ? undefined
      : rule.message,
};

export function validateFieldValue(
  fieldType: string,
  value: unknown,
  rules: ValidationRule[],
  data: Record<string, unknown>
): string | undefined {
  const isEmpty = value === undefined || value === null || value === "";
  const requiredRule = rules.find((rule) => rule.type === "required");

  if (isEmpty) {
    return requiredRule?.message;
  }

  for (const rule of rules) {
    const error = ruleHandlers[rule.type](rule as never, {
      fieldType,
      value,
      data,
    });

    if (error) {
      return error;
    }
  }

  return undefined;
}
