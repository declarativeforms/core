import type { ICompiledValidationRule } from '../types';
import { evaluateExpression } from '../compile/expression';

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * Whether a single rule passes. Empty values pass every rule except `required`
 * and count-based `min`/`max` on arrays (so an unfilled field is only flagged
 * when required). Bounds dispatch on value/bound shape: array → count, string
 * bound → lexical, otherwise numeric.
 */
function passes(
  rule: ICompiledValidationRule,
  value: unknown,
  data: Record<string, unknown>,
): boolean {
  switch (rule.type) {
    case 'required':
      return !isEmpty(value);
    case 'expression':
      return evaluateExpression(rule.expression, data);
    case 'pattern':
      return isEmpty(value) || new RegExp(rule.regex).test(String(value));
    case 'min_length':
      return isEmpty(value) || String(value).length >= rule.value;
    case 'max_length':
      return isEmpty(value) || String(value).length <= rule.value;
    case 'min':
      if (Array.isArray(value)) return value.length >= Number(rule.value);
      if (isEmpty(value)) return true;
      return typeof rule.value === 'number'
        ? !Number.isFinite(Number(value)) || Number(value) >= rule.value
        : String(value) >= String(rule.value);
    case 'max':
      if (Array.isArray(value)) return value.length <= Number(rule.value);
      if (isEmpty(value)) return true;
      return typeof rule.value === 'number'
        ? !Number.isFinite(Number(value)) || Number(value) <= rule.value
        : String(value) <= String(rule.value);
  }
}

/**
 * Run a compiled field's validation rules against a value, returning the first
 * failing rule's (already-resolved) message, or `undefined` when valid. Pure
 * and framework-agnostic — the counterpart to `compile` producing the rules.
 * `data` is the full answer set, used by `expression` rules.
 */
export function validateField(
  field: { validation: ICompiledValidationRule[] },
  value: unknown,
  data: Record<string, unknown>,
): string | undefined {
  for (const rule of field.validation) {
    if (!passes(rule, value, data)) {
      return rule.message;
    }
  }
  return undefined;
}
