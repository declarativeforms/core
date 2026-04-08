import { evaluateExpression, interpolateTemplate, resolveLocalizedText } from "@declarativeforms/common";
import type {
  DeclarativeFieldType,
  IDeclarativeForm,
  IDeclarativeFormValidator,
  ILocalizedText,
} from "@declarativeforms/types";
import { isDeclarativeFieldType } from "@declarativeforms/types";
import { DEFAULT_MESSAGES, type ValidationMessages } from "./messages";
import type { CompiledField, CompiledOption, ValidationRule } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ValidatorWithValue = {
  type: "min" | "max";
  value: number | string;
  message?: ILocalizedText;
};

function getMinValidator(
  validators: IDeclarativeFormValidator[],
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
  validators: IDeclarativeFormValidator[],
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
  validators: IDeclarativeFormValidator[],
  type: string,
): boolean {
  return validators.some(
    (validator) => typeof validator === "object" && validator.type === type,
  );
}

function getRatingRangeFromValidators(validators: IDeclarativeFormValidator[]): {
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

// ---------------------------------------------------------------------------
// Rule building — compilation step (IDeclarativeFormValidator[] → ValidationRule[])
// ---------------------------------------------------------------------------

export function buildValidationRules(
  fieldType: DeclarativeFieldType,
  validators: IDeclarativeFormValidator[],
  label: string,
  locale: string,
  messages: ValidationMessages = DEFAULT_MESSAGES,
): ValidationRule[] {
  const rules: ValidationRule[] = [];

  for (const validator of validators) {
    if (validator === "required") {
      rules.push({
        type: "required",
        message: interpolateTemplate(messages.required, {}, { label }),
      });
      continue;
    }

    if (validator.type === "required") {
      rules.push({
        type: "required",
        message:
          resolveLocalizedText(validator.message, locale) ||
          interpolateTemplate(messages.required, {}, { label }),
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
            resolveLocalizedText(validator.message, locale) ||
            interpolateTemplate(messages.invalid, {}, { label }),
        });
        break;

      case "min_length":
        if (typeof validator.value !== "number") break;
        rules.push({
          type: "min_length",
          value: validator.value,
          message:
            resolveLocalizedText(validator.message, locale) ||
            interpolateTemplate(messages.min_length, {}, {
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
            resolveLocalizedText(validator.message, locale) ||
            interpolateTemplate(messages.max_length, {}, {
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
            resolveLocalizedText(validator.message, locale) ||
            interpolateTemplate(messages.invalid, {}, { label }),
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
          resolveLocalizedText(minVal.message, locale) ||
          interpolateTemplate(messages.date_min, {}, {
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
          resolveLocalizedText(maxVal.message, locale) ||
          interpolateTemplate(messages.date_max, {}, {
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
        message: interpolateTemplate(messages.whole_number, {}, { label }),
      });
    }
    if (minVal && typeof minVal.value === "number") {
      rules.push({
        type: "min",
        value: minVal.value,
        message:
          resolveLocalizedText(minVal.message, locale) ||
          interpolateTemplate(messages.number_min, {}, {
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
          resolveLocalizedText(maxVal.message, locale) ||
          interpolateTemplate(messages.number_max, {}, {
            label,
            max: maxVal.value,
          }),
      });
    }
  }

  if (fieldType === "rating") {
    const range = getRatingRangeFromValidators(validators);
    rules.push({
      type: "min",
      value: range.min,
      message:
        resolveLocalizedText(minVal?.message, locale) ||
        interpolateTemplate(messages.number_min, {}, { label, min: range.min }),
    });
    rules.push({
      type: "max",
      value: range.max,
      message:
        resolveLocalizedText(maxVal?.message, locale) ||
        interpolateTemplate(messages.number_max, {}, { label, max: range.max }),
    });
  }

  if (fieldType === "file_upload") {
    if (minVal && typeof minVal.value === "number") {
      rules.push({
        type: "min",
        value: minVal.value,
        message:
          resolveLocalizedText(minVal.message, locale) ||
          interpolateTemplate(messages.file_min, {}, {
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
          resolveLocalizedText(maxVal.message, locale) ||
          interpolateTemplate(messages.file_max, {}, {
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
          resolveLocalizedText(minVal.message, locale) ||
          interpolateTemplate(messages.selection_min, {}, {
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
          resolveLocalizedText(maxVal.message, locale) ||
          interpolateTemplate(messages.selection_max, {}, {
            label,
            max: maxVal.value,
          }),
      });
    }
  }

  if (fieldType === "turnstile" && !rules.some((rule) => rule.type === "required")) {
    rules.push({
      type: "required",
      message: interpolateTemplate(messages.required, {}, { label }),
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
    evaluateExpression(rule.expression, data, false)
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
  messages: ValidationMessages = DEFAULT_MESSAGES,
): Record<string, string> {
  const section = (schema.sections ?? []).find(
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

    if (field.visible_when && !evaluateExpression(field.visible_when, formData, false)) {
      continue;
    }

    const rules = buildValidationRules(
      field.type,
      field.validators ?? [],
      resolveLocalizedText(field.label, locale),
      locale,
      messages,
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
// Query utilities — extract data from compiled ValidationRule arrays
// ---------------------------------------------------------------------------

export type RatingRange = {
  min: number;
  max: number;
};

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
// Field metadata — framework-agnostic validation config for UI consumers
// ---------------------------------------------------------------------------

export type FieldValidator = (
  value: unknown,
  formValues: Record<string, unknown>,
) => true | string;

export type FieldValidationConfig = {
  required?: string;
  pattern?: { value: RegExp; message: string };
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  validate?: Record<string, FieldValidator>;
};

export type FieldMetadata = {
  config: FieldValidationConfig;
  minLength?: number;
  maxLength?: number;
  minBound?: number;
  maxBound?: number;
  minRule?: Extract<ValidationRule, { type: "min" }>;
  maxRule?: Extract<ValidationRule, { type: "max" }>;
  hasPattern: boolean;
  ratingRange?: RatingRange;
  options?: CompiledOption[];
};

function getValueCount(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }

  return value ? 1 : 0;
}

function applyCommonRules(field: CompiledField): FieldValidationConfig {
  const rules: FieldValidationConfig = {};

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
): Record<string, FieldValidator> {
  const validators: Record<string, FieldValidator> = {};

  validation.forEach((rule, i) => {
    if (rule.type !== "expression") return;

    validators[`expr_${i}`] = (
      _value: unknown,
      formValues: Record<string, unknown>,
    ) => {
      const data =
        formValues && typeof formValues === "object" ? formValues : {};

      return evaluateExpression(rule.expression, data, false)
        ? true
        : rule.message;
    };
  });

  return validators;
}

function buildFieldTypeValidators(
  field: CompiledField,
): Record<string, FieldValidator> {
  const validateFns: Record<string, FieldValidator> = {};

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

export function buildFieldMetadata(field: CompiledField): FieldMetadata {
  const config = applyCommonRules(field);
  const validateFns = {
    ...buildFieldTypeValidators(field),
    ...buildExpressionValidators(field.validation),
  };

  if (Object.keys(validateFns).length > 0) {
    config.validate = validateFns;
  }

  return {
    config,
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
