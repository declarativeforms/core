import { getNumericBound } from "../view-support/field-support";
import type { ValidationRule } from "../runtime/types";

export type RatingRange = {
  max: number;
  min: number;
};

export function getRatingRange(validation: ValidationRule[]): RatingRange {
  const min = Math.trunc(getNumericBound(validation, "min") ?? 1);
  const max = Math.trunc(getNumericBound(validation, "max") ?? 5);

  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    return { max: 5, min: 1 };
  }

  return { max, min };
}
