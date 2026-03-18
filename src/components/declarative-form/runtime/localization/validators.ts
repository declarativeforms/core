import type { IDeclarativeFormValidator } from "../../types";
import { resolveLocalizedText } from "./text";

export type LocalizedValidator =
  | "required"
  | { type: "pattern"; regex: string; message?: string }
  | { type: "min"; value: number | string; message?: string }
  | { type: "max"; value: number | string; message?: string }
  | { type: "min_length"; value: number; message?: string }
  | { type: "max_length"; value: number; message?: string }
  | { type: "expression"; expression: string; message?: string };

export function resolveValidator(
  validator: IDeclarativeFormValidator,
  locale: string
): LocalizedValidator | null {
  if (validator === "required") {
    return validator;
  }

  if (!validator.type) {
    return null;
  }

  const localizedMessage = resolveLocalizedText(validator.message, locale);
  switch (validator.type) {
    case "pattern":
      if (!validator.regex) {
        return null;
      }
      return {
        type: "pattern",
        regex: validator.regex,
        message: localizedMessage || undefined,
      };

    case "min":
      if (validator.value === undefined) {
        return null;
      }
      return {
        type: "min",
        value: validator.value,
        message: localizedMessage || undefined,
      };

    case "max":
      if (validator.value === undefined) {
        return null;
      }
      return {
        type: "max",
        value: validator.value,
        message: localizedMessage || undefined,
      };

    case "min_length":
      if (typeof validator.value !== "number") {
        return null;
      }
      return {
        type: "min_length",
        value: validator.value,
        message: localizedMessage || undefined,
      };

    case "max_length":
      if (typeof validator.value !== "number") {
        return null;
      }
      return {
        type: "max_length",
        value: validator.value,
        message: localizedMessage || undefined,
      };

    case "expression":
      if (!validator.expression) {
        return null;
      }
      return {
        type: "expression",
        expression: validator.expression,
        message: localizedMessage || undefined,
      };
  }
}

export function resolveLocalizedValidators(
  validators: IDeclarativeFormValidator[] | undefined,
  locale: string
): LocalizedValidator[] {
  return (validators ?? []).flatMap((validator) => {
    const resolved = resolveValidator(validator, locale);
    return resolved ? [resolved] : [];
  });
}
