import type { ICompiledValidationRule } from '../types';
import { evaluateExpression } from '../compile/expression';

function isValueEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function isValidationRuleSatisfied(
  rule: ICompiledValidationRule,
  value: unknown,
  data: Record<string, unknown>,
): boolean {
  switch (rule.type) {
    case 'required':
      return !isValueEmpty(value);
    case 'expression':
      return evaluateExpression(rule.expression, data);
    case 'pattern':
      return isValueEmpty(value) || new RegExp(rule.regex).test(String(value));
    case 'min_length':
      return isValueEmpty(value) || String(value).length >= rule.value;
    case 'max_length':
      return isValueEmpty(value) || String(value).length <= rule.value;
    case 'min':
      if (Array.isArray(value)) {
        return value.length >= Number(rule.value);
      }

      if (isValueEmpty(value)) {
        return true;
      }

      return typeof rule.value === 'number'
        ? !Number.isFinite(Number(value)) || Number(value) >= rule.value
        : String(value) >= String(rule.value);
    case 'max':
      if (Array.isArray(value)) {
        return value.length <= Number(rule.value);
      }

      if (isValueEmpty(value)) {
        return true;
      }

      return typeof rule.value === 'number'
        ? !Number.isFinite(Number(value)) || Number(value) <= rule.value
        : String(value) <= String(rule.value);
  }
}

export function validateField(
  field: { validation: Array<ICompiledValidationRule> },
  value: unknown,
  data: Record<string, unknown>,
): string | undefined {
  for (const rule of field.validation) {
    if (!isValidationRuleSatisfied(rule, value, data)) {
      return rule.message;
    }
  }

  return undefined;
}
