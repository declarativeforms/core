import type { ICompiledValidationRule } from '../types';

export function findValidationRule<T extends ICompiledValidationRule['type']>(
  rules: Array<ICompiledValidationRule>,
  type: T,
): Extract<ICompiledValidationRule, { type: T }> | undefined {
  return rules.find(
    (rule): rule is Extract<ICompiledValidationRule, { type: T }> =>
      rule.type === type,
  );
}

export function getCharLimit(
  rules: Array<ICompiledValidationRule>,
  type: 'min_length' | 'max_length',
): number | undefined {
  return findValidationRule(rules, type)?.value;
}

export function getNumericBound(
  rules: Array<ICompiledValidationRule>,
  type: 'min' | 'max',
): number | undefined {
  const rule = findValidationRule(rules, type);
  return rule && typeof rule.value === 'number' ? rule.value : undefined;
}

export function getRatingRange(rules: Array<ICompiledValidationRule>): {
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
