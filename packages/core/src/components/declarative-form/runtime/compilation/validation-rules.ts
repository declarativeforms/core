import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/i18n/locales";
import { translate } from "@/i18n/runtime";

import type {
  DeclarativeFieldType,
  IDeclarativeFormValidator,
  ILocalizedText,
} from "../../types";
import { resolveLocalizedText } from "../localization/text";
import type { ValidationRule } from "../types";

function toLocale(locale: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : DEFAULT_LOCALE;
}

function resolveMessage(
  message: ILocalizedText | undefined,
  locale: string
): string | undefined {
  return resolveLocalizedText(message, locale) || undefined;
}

function getMinValidator(
  validators: IDeclarativeFormValidator[]
): Extract<
  Exclude<IDeclarativeFormValidator, "required">,
  { type?: "min" }
> | undefined {
  return validators.find(
    (v): v is Extract<Exclude<IDeclarativeFormValidator, "required">, { type?: "min" }> =>
      typeof v === "object" && v.type === "min" && v.value !== undefined
  );
}

function getMaxValidator(
  validators: IDeclarativeFormValidator[]
): Extract<
  Exclude<IDeclarativeFormValidator, "required">,
  { type?: "max" }
> | undefined {
  return validators.find(
    (v): v is Extract<Exclude<IDeclarativeFormValidator, "required">, { type?: "max" }> =>
      typeof v === "object" && v.type === "max" && v.value !== undefined
  );
}

function hasValidator(
  validators: IDeclarativeFormValidator[],
  type: string
): boolean {
  return validators.some(
    (validator) => typeof validator === "object" && validator.type === type
  );
}

function getRatingRange(
  validators: IDeclarativeFormValidator[]
): { min: number; max: number } {
  const minVal = getMinValidator(validators);
  const maxVal = getMaxValidator(validators);

  const min =
    minVal &&
    typeof minVal.value === "number" &&
    minVal.value >= 1
      ? minVal.value
      : 1;
  const max =
    maxVal &&
    typeof maxVal.value === "number" &&
    maxVal.value >= min
      ? maxVal.value
      : 5;

  return { min, max };
}

export function buildValidationRules(
  fieldType: DeclarativeFieldType,
  validators: IDeclarativeFormValidator[] | undefined,
  label: string,
  locale: string
): ValidationRule[] {
  const rules: ValidationRule[] = [];
  const loc = toLocale(locale);
  const resolved = validators ?? [];

  for (const validator of resolved) {
    if (validator === "required") {
      rules.push({
        type: "required",
        message: translate(loc, "validation.required", { label }),
      });
      continue;
    }

    if (!validator.type) {
      continue;
    }

    const message = resolveMessage(validator.message, locale);

    switch (validator.type) {
      case "pattern":
        if (!validator.regex) break;
        rules.push({
          type: "pattern",
          regex: validator.regex,
          message:
            message ||
            translate(loc, "validation.invalid", { label }),
        });
        break;

      case "min_length":
        if (typeof validator.value !== "number") break;
        rules.push({
          type: "min_length",
          value: validator.value,
          message:
            message ||
            translate(loc, "validation.min_length", {
              label,
              min: validator.value,
            }),
        });
        break;

      case "max_length":
        if (typeof validator.value !== "number") break;
        rules.push({
          type: "max_length",
          value: validator.value,
          message:
            message ||
            translate(loc, "validation.max_length", {
              label,
              max: validator.value,
            }),
        });
        break;

      case "expression":
        if (!validator.expression) break;
        rules.push({
          type: "expression",
          expression: validator.expression,
          message:
            message ||
            translate(loc, "validation.invalid", { label }),
        });
        break;
    }
  }

  const minVal = getMinValidator(resolved);
  const maxVal = getMaxValidator(resolved);
  const minMessage = minVal ? resolveMessage(minVal.message, locale) : undefined;
  const maxMessage = maxVal ? resolveMessage(maxVal.message, locale) : undefined;

  if (fieldType === "date" || fieldType === "date_month" || fieldType === "time") {
    if (minVal && minVal.value !== undefined) {
      rules.push({
        type: "min",
        value: minVal.value,
        message:
          minMessage ||
          translate(loc, "validation.date_min", {
            label,
            min: String(minVal.value),
          }),
      });
    }
    if (maxVal && maxVal.value !== undefined) {
      rules.push({
        type: "max",
        value: maxVal.value,
        message:
          maxMessage ||
          translate(loc, "validation.date_max", {
            label,
            max: String(maxVal.value),
          }),
      });
    }
  }

  if (fieldType === "number") {
    if (!hasValidator(resolved, "pattern")) {
      rules.push({
        type: "pattern",
        regex: "^\\d+$",
        message: translate(loc, "validation.whole_number", { label }),
      });
    }
    if (minVal && typeof minVal.value === "number") {
      rules.push({
        type: "min",
        value: minVal.value,
        message:
          minMessage ||
          translate(loc, "validation.number_min", {
            label,
            min: minVal.value,
          }),
      });
    }
    if (maxVal && typeof maxVal.value === "number") {
      rules.push({
        type: "max",
        value: maxVal.value,
        message:
          maxMessage ||
          translate(loc, "validation.number_max", {
            label,
            max: maxVal.value,
          }),
      });
    }
  }

  if (fieldType === "rating") {
    const range = getRatingRange(resolved);
    rules.push({
      type: "min",
      value: range.min,
      message:
        minMessage ||
        translate(loc, "validation.number_min", { label, min: range.min }),
    });
    rules.push({
      type: "max",
      value: range.max,
      message:
        maxMessage ||
        translate(loc, "validation.number_max", { label, max: range.max }),
    });
  }

  if (fieldType === "file_upload") {
    if (minVal && typeof minVal.value === "number") {
      rules.push({
        type: "min",
        value: minVal.value,
        message:
          minMessage ||
          translate(loc, "validation.file_min", {
            label,
            min: minVal.value,
          }),
      });
    }
    if (maxVal && typeof maxVal.value === "number") {
      rules.push({
        type: "max",
        value: maxVal.value,
        message:
          maxMessage ||
          translate(loc, "validation.file_max", {
            label,
            max: maxVal.value,
          }),
      });
    }
  }

  if (fieldType === "multiple_select") {
    if (minVal && typeof minVal.value === "number") {
      rules.push({
        type: "min",
        value: minVal.value,
        message:
          minMessage ||
          translate(loc, "validation.selection_min", {
            label,
            min: minVal.value,
          }),
      });
    }
    if (maxVal && typeof maxVal.value === "number") {
      rules.push({
        type: "max",
        value: maxVal.value,
        message:
          maxMessage ||
          translate(loc, "validation.selection_max", {
            label,
            max: maxVal.value,
          }),
      });
    }
  }

  if (fieldType === "turnstile" && !rules.some((rule) => rule.type === "required")) {
    rules.push({
      type: "required",
      message: translate(loc, "validation.required", { label }),
    });
  }

  return rules;
}
