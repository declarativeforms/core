import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/i18n/locales";
import { translate } from "@/i18n/runtime";

import type { LocalizedValidator } from "./localize";
import type { CompiledField, ValidationRule } from "./types";

type ValidatorWithValue = Extract<
  Exclude<LocalizedValidator, "required">,
  { value: number | string }
>;

function toLocale(locale: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : DEFAULT_LOCALE;
}

function getMinValidator(
  validators: LocalizedValidator[]
): ValidatorWithValue | undefined {
  return validators.find(
    (v) => typeof v === "object" && v.type === "min"
  ) as ValidatorWithValue | undefined;
}

function getMaxValidator(
  validators: LocalizedValidator[]
): ValidatorWithValue | undefined {
  return validators.find(
    (v) => typeof v === "object" && v.type === "max"
  ) as ValidatorWithValue | undefined;
}

function hasValidator(
  validators: LocalizedValidator[],
  type: string
): boolean {
  return validators.some(
    (v) => typeof v === "object" && v.type === type
  );
}

function getRatingRange(validators: LocalizedValidator[]): {
  min: number;
  max: number;
} {
  const minVal = getMinValidator(validators);
  const maxVal = getMaxValidator(validators);

  const min =
    minVal && typeof minVal.value === "number" && minVal.value >= 1
      ? minVal.value
      : 1;
  const max =
    maxVal && typeof maxVal.value === "number" && maxVal.value >= min
      ? maxVal.value
      : 5;

  return { min, max };
}

export function compileFieldValidation(
  fieldType: CompiledField["type"],
  validators: LocalizedValidator[],
  label: string,
  locale: string
): ValidationRule[] {
  const rules: ValidationRule[] = [];
  const loc = toLocale(locale);

  for (const validator of validators) {
    if (validator === "required") {
      rules.push({
        type: "required",
        message: translate(loc, "validation.required", { label }),
      });
      continue;
    }

    switch (validator.type) {
      case "pattern":
        rules.push({
          type: "pattern",
          regex: validator.regex,
          message:
            validator.message ||
            translate(loc, "validation.invalid", { label }),
        });
        break;

      case "min_length":
        rules.push({
          type: "min_length",
          value: validator.value,
          message:
            validator.message ||
            translate(loc, "validation.min_length", {
              label,
              min: validator.value,
            }),
        });
        break;

      case "max_length":
        rules.push({
          type: "max_length",
          value: validator.value,
          message:
            validator.message ||
            translate(loc, "validation.max_length", {
              label,
              max: validator.value,
            }),
        });
        break;

      case "expression":
        rules.push({
          type: "expression",
          expression: validator.expression,
          message:
            validator.message ||
            translate(loc, "validation.invalid", { label }),
        });
        break;
    }
  }

  const minVal = getMinValidator(validators);
  const maxVal = getMaxValidator(validators);

  if (fieldType === "date") {
    if (minVal) {
      rules.push({
        type: "min",
        value: minVal.value,
        message:
          minVal.message ||
          translate(loc, "validation.date_min", {
            label,
            min: String(minVal.value),
          }),
      });
    }
    if (maxVal) {
      rules.push({
        type: "max",
        value: maxVal.value,
        message:
          maxVal.message ||
          translate(loc, "validation.date_max", {
            label,
            max: String(maxVal.value),
          }),
      });
    }
  }

  if (fieldType === "number") {
    if (!hasValidator(validators, "pattern")) {
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
          minVal.message ||
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
          maxVal.message ||
          translate(loc, "validation.number_max", {
            label,
            max: maxVal.value,
          }),
      });
    }
  }

  if (fieldType === "rating") {
    const range = getRatingRange(validators);
    rules.push({
      type: "min",
      value: range.min,
      message:
        minVal?.message ||
        translate(loc, "validation.number_min", { label, min: range.min }),
    });
    rules.push({
      type: "max",
      value: range.max,
      message:
        maxVal?.message ||
        translate(loc, "validation.number_max", { label, max: range.max }),
    });
  }

  if (fieldType === "file_upload") {
    if (minVal && typeof minVal.value === "number") {
      rules.push({
        type: "min",
        value: minVal.value,
        message:
          minVal.message ||
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
          maxVal.message ||
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
          minVal.message ||
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
          maxVal.message ||
          translate(loc, "validation.selection_max", {
            label,
            max: maxVal.value,
          }),
      });
    }
  }

  if (fieldType === "turnstile" && !rules.some((r) => r.type === "required")) {
    rules.push({
      type: "required",
      message: translate(loc, "validation.required", { label }),
    });
  }

  return rules;
}
