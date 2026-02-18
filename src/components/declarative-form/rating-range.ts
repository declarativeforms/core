import type { DeclarativeFieldMeta } from "./field-contract";

export type RatingRange = {
  max: number;
  min: number;
};

export function getRatingRange(
  meta: Pick<DeclarativeFieldMeta, "maxValidator" | "minValidator">
): RatingRange {
  const min =
    typeof meta.minValidator?.value === "number"
      ? Math.trunc(meta.minValidator.value)
      : 1;
  const max =
    typeof meta.maxValidator?.value === "number"
      ? Math.trunc(meta.maxValidator.value)
      : 5;

  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    return { max: 5, min: 1 };
  }

  return { max, min };
}
