import type { RegisterOptions, Validate } from "react-hook-form";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/i18n/locales";
import { translate } from "@/i18n/runtime";

import { evaluateValidationExpression } from "./runtime/core/expression";
import { getEmailValidation } from "./fields/email/validation";
import { localizeForm } from "./runtime/localization/form";
import type { ILocalizedFormValidator } from "./runtime/localization/form";
import type { IDeclarativeForm } from "./types";
import { isDeclarativeFieldType, type DeclarativeFieldType } from "./types";
import type {
  CompiledField,
  CompiledOption,
  ValidationRule,
} from "./runtime/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ValidationMessages = {
  emailOtpRequired?: string;
  emailFreeEmailBlocked?: string;
};

export type RatingRange = {
  min: number;
  max: number;
};

/**
 * Result of `buildFieldValidation()`. Contains everything a field component or
 * the renderer needs for validation, pre-computed for the given field type.
 */
export type FieldValidation = {
  /** React Hook Form register options (required, pattern, validate, etc.) */
  registerOptions: RegisterOptions;

  /** Pre-extracted min_length value, if present in the field's validation rules. */
  minLength?: number;
  /** Pre-extracted max_length value, if present in the field's validation rules. */
  maxLength?: number;
  /** Pre-extracted numeric min bound, if present in the field's validation rules. */
  minBound?: number;
  /** Pre-extracted numeric max bound, if present in the field's validation rules. */
  maxBound?: number;
  /** The full min validation rule (with message), for date/time min attributes. */
  minRule?: Extract<ValidationRule, { type: "min" }>;
  /** The full max validation rule (with message), for date/time max attributes. */
  maxRule?: Extract<ValidationRule, { type: "max" }>;
  /** Whether a pattern rule exists in the field's validation. */
  hasPattern: boolean;
  /** Rating min/max range (only present for rating fields). */
  ratingRange?: RatingRange;
  /** Compiled options (only present for dropdown, single_select, multiple_select). */
  options?: CompiledOption[];
};

// ---------------------------------------------------------------------------
// Query utilities — extract data from compiled ValidationRule arrays
// ---------------------------------------------------------------------------

export function findValidationRule<T extends ValidationRule["type"]>(
  rules: ValidationRule[],
  type: T,
): Extract<ValidationRule, { type: T }> | undefined {
  return rules.find(
    (rule): rule is Extract<ValidationRule, { type: T }> => rule.type === type,
  );
}

export function getNumericRuleValue(
  rules: ValidationRule[],
  type: "min_length" | "max_length",
): number | undefined {
  return findValidationRule(rules, type)?.value;
}

export function getNumericBound(
  rules: ValidationRule[],
  type: "min" | "max",
): number | undefined {
  const rule = findValidationRule(rules, type);
  return rule && typeof rule.value === "number" ? rule.value : undefined;
}

export function getFieldOptions(
  field: CompiledField,
): CompiledOption[] | undefined {
  return "options" in field ? field.options : undefined;
}

export function getRatingRange(validation: ValidationRule[]): RatingRange {
  const min = Math.trunc(getNumericBound(validation, "min") ?? 1);
  const max = Math.trunc(getNumericBound(validation, "max") ?? 5);

  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    return { max: 5, min: 1 };
  }

  return { max, min };
}

// ---------------------------------------------------------------------------
// Rule building — compilation step (ILocalizedFormValidator[] → ValidationRule[])
// ---------------------------------------------------------------------------

type ValidatorWithValue = {
  type: "min" | "max";
  value: number | string;
  message?: string;
};

function toLocale(locale: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : DEFAULT_LOCALE;
}

function getMinValidator(
  validators: ILocalizedFormValidator[],
): ValidatorWithValue | undefined {
  const found = validators.find(
    (validator) =>
      typeof validator === "object" &&
      validator.type === "min" &&
      validator.value !== undefined,
  );
  return found as ValidatorWithValue | undefined;
}

function getMaxValidator(
  validators: ILocalizedFormValidator[],
): ValidatorWithValue | undefined {
  const found = validators.find(
    (validator) =>
      typeof validator === "object" &&
      validator.type === "max" &&
      validator.value !== undefined,
  );
  return found as ValidatorWithValue | undefined;
}

function hasValidator(
  validators: ILocalizedFormValidator[],
  type: string,
): boolean {
  return validators.some(
    (validator) => typeof validator === "object" && validator.type === type,
  );
}

function getSchemaRatingRange(validators: ILocalizedFormValidator[]): {
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

export function buildValidationRules(
  fieldType: DeclarativeFieldType,
  validators: ILocalizedFormValidator[],
  label: string,
  locale: string,
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
        if (!validator.regex) break;
        rules.push({
          type: "pattern",
          regex: validator.regex,
          message:
            validator.message ||
            translate(loc, "validation.invalid", { label }),
        });
        break;

      case "min_length":
        if (typeof validator.value !== "number") break;
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
        if (typeof validator.value !== "number") break;
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
        if (!validator.expression) break;
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

  if (fieldType === "date" || fieldType === "date_month" || fieldType === "time") {
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
    const range = getSchemaRatingRange(validators);
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

  if (fieldType === "turnstile" && !rules.some((rule) => rule.type === "required")) {
    rules.push({
      type: "required",
      message: translate(loc, "validation.required", { label }),
    });
  }

  return rules;
}

// ---------------------------------------------------------------------------
// Rule execution — runtime validation of field values
// ---------------------------------------------------------------------------

function getSelectionCount(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }

  return value ? 1 : 0;
}

const ruleHandlers: {
  [K in ValidationRule["type"]]: (
    rule: Extract<ValidationRule, { type: K }>,
    context: {
      fieldType: string;
      value: unknown;
      data: Record<string, unknown>;
    },
  ) => string | undefined;
} = {
  required: () => undefined,
  pattern: (rule, { value }) =>
    new RegExp(rule.regex).test(String(value)) ? undefined : rule.message,
  min_length: (rule, { value }) =>
    String(value).length < rule.value ? rule.message : undefined,
  max_length: (rule, { value }) =>
    String(value).length > rule.value ? rule.message : undefined,
  min: (rule, { fieldType, value }) => {
    if (fieldType === "file_upload" || fieldType === "multiple_select") {
      return getSelectionCount(value) < Number(rule.value)
        ? rule.message
        : undefined;
    }

    if (fieldType === "number" || fieldType === "rating") {
      const numValue = Number(value);
      return Number.isFinite(numValue) && numValue < Number(rule.value)
        ? rule.message
        : undefined;
    }

    return String(value) < String(rule.value) ? rule.message : undefined;
  },
  max: (rule, { fieldType, value }) => {
    if (fieldType === "file_upload" || fieldType === "multiple_select") {
      return getSelectionCount(value) > Number(rule.value)
        ? rule.message
        : undefined;
    }

    if (fieldType === "number" || fieldType === "rating") {
      const numValue = Number(value);
      return Number.isFinite(numValue) && numValue > Number(rule.value)
        ? rule.message
        : undefined;
    }

    return String(value) > String(rule.value) ? rule.message : undefined;
  },
  expression: (rule, { data }) =>
    evaluateValidationExpression(rule.expression, data)
      ? undefined
      : rule.message,
};

export function validateFieldValue(
  fieldType: string,
  value: unknown,
  rules: ValidationRule[],
  data: Record<string, unknown>,
): string | undefined {
  const isEmpty = value === undefined || value === null || value === "";
  const requiredRule = rules.find((rule) => rule.type === "required");

  if (isEmpty) {
    return requiredRule?.message;
  }

  for (const rule of rules) {
    const error = ruleHandlers[rule.type](rule as never, {
      fieldType,
      value,
      data,
    });

    if (error) {
      return error;
    }
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Section validation — validates all fields in a section at once
// ---------------------------------------------------------------------------

export function validateSectionData(
  schema: IDeclarativeForm,
  locale: string,
  sectionId: string,
  sectionData: Record<string, unknown>,
  formData: Record<string, unknown>,
): Record<string, string> {
  const localizedSchema = localizeForm(schema, locale);
  const section = (localizedSchema.sections ?? []).find(
    (candidate) => candidate.id === sectionId,
  );
  if (!section) {
    return {};
  }

  const errors: Record<string, string> = {};

  for (const field of section.fields ?? []) {
    if (!isDeclarativeFieldType(field.type)) {
      continue;
    }

    const rules = buildValidationRules(
      field.type,
      field.validators ?? [],
      field.label ?? "",
      locale,
    );
    const fieldId = field.id ?? "";
    const value = sectionData[fieldId];
    const error = validateFieldValue(field.type, value, rules, formData);
    if (error) {
      errors[fieldId] = error;
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// React Hook Form integration — convert ValidationRule[] to RegisterOptions
// ---------------------------------------------------------------------------

function getValueCount(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }

  return value ? 1 : 0;
}

function applyCommonRules(field: CompiledField): RegisterOptions {
  const rules: RegisterOptions = {};

  for (const rule of field.validation) {
    switch (rule.type) {
      case "required":
        rules.required = rule.message;
        break;
      case "pattern":
        rules.pattern = { value: new RegExp(rule.regex), message: rule.message };
        break;
      case "min_length":
        rules.minLength = { value: rule.value, message: rule.message };
        break;
      case "max_length":
        rules.maxLength = { value: rule.value, message: rule.message };
        break;
    }
  }

  return rules;
}

function buildExpressionValidators(
  validation: ValidationRule[],
): Record<string, Validate<unknown, Record<string, unknown>>> {
  const validators: Record<string, Validate<unknown, Record<string, unknown>>> =
    {};

  validation.forEach((rule, i) => {
    if (rule.type !== "expression") return;

    validators[`expr_${i}`] = (
      _value: unknown,
      formValues: Record<string, unknown>,
    ) => {
      const data =
        formValues && typeof formValues === "object" ? formValues : {};

      return evaluateValidationExpression(rule.expression, data)
        ? true
        : rule.message;
    };
  });

  return validators;
}

function buildFieldTypeValidators(
  field: CompiledField,
): Record<string, Validate<unknown, Record<string, unknown>>> {
  const validateFns: Record<
    string,
    Validate<unknown, Record<string, unknown>>
  > = {};

  switch (field.type) {
    case "date":
    case "date_month":
    case "time": {
      const minRule = findValidationRule(field.validation, "min");
      const maxRule = findValidationRule(field.validation, "max");

      if (minRule) {
        validateFns.minDate = (value) =>
          value && String(value) < String(minRule.value)
            ? minRule.message
            : true;
      }
      if (maxRule) {
        validateFns.maxDate = (value) =>
          value && String(value) > String(maxRule.value)
            ? maxRule.message
            : true;
      }
      break;
    }

    case "number": {
      const minRule = findValidationRule(field.validation, "min");
      const maxRule = findValidationRule(field.validation, "max");
      const patternRule = findValidationRule(field.validation, "pattern");

      validateFns.fieldType = (value) => {
        if (value === undefined || value === null || value === "") return true;

        const num = Number(value);
        if (patternRule && (!Number.isFinite(num) || !Number.isInteger(num))) {
          return patternRule.message;
        }
        if (minRule && typeof minRule.value === "number" && num < minRule.value) {
          return minRule.message;
        }
        if (maxRule && typeof maxRule.value === "number" && num > maxRule.value) {
          return maxRule.message;
        }
        return true;
      };
      break;
    }

    case "rating": {
      const minRule = findValidationRule(field.validation, "min");
      const maxRule = findValidationRule(field.validation, "max");

      validateFns.fieldType = (value) => {
        if (value === undefined || value === null || value === "") return true;

        const num = Number(value);
        if (minRule && num < Number(minRule.value)) return minRule.message;
        if (maxRule && num > Number(maxRule.value)) return maxRule.message;
        return true;
      };
      break;
    }

    case "file_upload":
    case "multiple_select": {
      const minRule = findValidationRule(field.validation, "min");
      const maxRule = findValidationRule(field.validation, "max");
      const requiredRule = findValidationRule(field.validation, "required");

      validateFns.fieldType = (value) => {
        const count =
          field.type === "multiple_select"
            ? Array.isArray(value)
              ? value.length
              : 0
            : getValueCount(value);

        if (field.required && count === 0 && requiredRule) {
          return requiredRule.message;
        }
        if (minRule && typeof minRule.value === "number" && count < minRule.value) {
          return minRule.message;
        }
        if (maxRule && typeof maxRule.value === "number" && count > maxRule.value) {
          return maxRule.message;
        }
        return true;
      };
      break;
    }
  }

  return validateFns;
}

function validationRulesToRegisterOptions(
  field: CompiledField,
  messages?: ValidationMessages,
): RegisterOptions {
  const rules = applyCommonRules(field);
  const validateFns = {
    ...buildFieldTypeValidators(field),
    ...buildExpressionValidators(field.validation),
  };

  const emailValidation = getEmailValidation(field, messages);
  if (emailValidation) {
    if (typeof emailValidation === "function") {
      validateFns.extension = emailValidation;
    } else {
      Object.assign(validateFns, emailValidation);
    }
  }

  if (Object.keys(validateFns).length > 0) {
    rules.validate = validateFns;
  }

  return rules;
}

// ---------------------------------------------------------------------------
// Builder — single entry-point for field components and the renderer
// ---------------------------------------------------------------------------

/**
 * Builds the complete validation object for a compiled field.
 *
 * Returns `registerOptions` for React Hook Form and pre-extracted helper
 * values that are applicable to the field's type. Field components can
 * destructure only what they need.
 *
 * @example
 * ```tsx
 * const { registerOptions, minLength, maxLength } = buildFieldValidation(field);
 * ```
 */
export function buildFieldValidation(
  field: CompiledField,
  messages?: ValidationMessages,
): FieldValidation {
  const registerOptions = validationRulesToRegisterOptions(field, messages);

  return {
    registerOptions,
    minLength: getNumericRuleValue(field.validation, "min_length"),
    maxLength: getNumericRuleValue(field.validation, "max_length"),
    minBound: getNumericBound(field.validation, "min"),
    maxBound: getNumericBound(field.validation, "max"),
    minRule: findValidationRule(field.validation, "min"),
    maxRule: findValidationRule(field.validation, "max"),
    hasPattern: field.validation.some((r) => r.type === "pattern"),
    ratingRange: field.type === "rating"
      ? getRatingRange(field.validation)
      : undefined,
    options: getFieldOptions(field),
  };
}
