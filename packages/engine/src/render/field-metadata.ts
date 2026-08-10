import type { ICompiledValidationRule } from '../types';

/** Find the first validation rule of a given type. */
export function findValidationRule<T extends ICompiledValidationRule['type']>(
  rules: ICompiledValidationRule[],
  type: T,
): Extract<ICompiledValidationRule, { type: T }> | undefined {
  return rules.find(
    (rule): rule is Extract<ICompiledValidationRule, { type: T }> =>
      rule.type === type,
  );
}

/** The numeric value of a `min_length`/`max_length` rule (character limits). */
export function getCharLimit(
  rules: ICompiledValidationRule[],
  type: 'min_length' | 'max_length',
): number | undefined {
  return findValidationRule(rules, type)?.value;
}

/** The numeric value of a `min`/`max` rule (returns undefined for string bounds). */
export function getNumericBound(
  rules: ICompiledValidationRule[],
  type: 'min' | 'max',
): number | undefined {
  const rule = findValidationRule(rules, type);
  return rule && typeof rule.value === 'number' ? rule.value : undefined;
}

/** The rating scale, truncated and defaulting to 1..5. */
export function getRatingRange(rules: ICompiledValidationRule[]): {
  min: number;
  max: number;
} {
  const min = Math.trunc(getNumericBound(rules, 'min') ?? 1);
  const max = Math.trunc(getNumericBound(rules, 'max') ?? 5);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    return { min: 1, max: 5 };
  }
  return { min, max };
}
