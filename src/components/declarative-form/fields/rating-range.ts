import { findValidationRule } from "../view-support/field-support";
import type { ValidationRule } from "../runtime/types";

export type RatingRange = {
  max: number;
  min: number;
};

export function getRatingRange(validation: ValidationRule[]): RatingRange {
  const minRule = findValidationRule(validation, "min");
  const maxRule = findValidationRule(validation, "max");

  const min =
    minRule && typeof minRule.value === "number"
      ? Math.trunc(minRule.value)
      : 1;
  const max =
    maxRule && typeof maxRule.value === "number"
      ? Math.trunc(maxRule.value)
      : 5;

  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    return { max: 5, min: 1 };
  }

  return { max, min };
}
