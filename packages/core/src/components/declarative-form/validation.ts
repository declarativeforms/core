import type { RegisterOptions, Validate } from "react-hook-form";

import { evaluateValidationExpression } from "./runtime/core/expression";
import type {
  CompiledField,
  CompiledOption,
  ValidationRule,
} from "./runtime/types";
import { FREE_EMAIL_DOMAINS } from "./fields/email/free-email-domains";
import { getOtpFieldNames, isOtpVerifiedValue } from "./fields/email/otp-field-names";

// --- Types ---

export type ValidationMessages = {
  emailOtpRequired?: string;
  emailFreeEmailBlocked?: string;
};

export type RatingRange = {
  min: number;
  max: number;
};

export type FieldValidation = {
  registerOptions: RegisterOptions;
  validate: (
    value: unknown,
    formData: Record<string, unknown>
  ) => string | undefined;
};

// --- Utility Functions ---

export function findValidationRule<T extends ValidationRule["type"]>(
  rules: ValidationRule[],
  type: T
): Extract<ValidationRule, { type: T }> | undefined {
  return rules.find(
    (rule): rule is Extract<ValidationRule, { type: T }> => rule.type === type
  );
}

export function getNumericRuleValue(
  rules: ValidationRule[],
  type: "min_length" | "max_length"
): number | undefined {
  return findValidationRule(rules, type)?.value;
}

export function getNumericBound(
  rules: ValidationRule[],
  type: "min" | "max"
): number | undefined {
  const rule = findValidationRule(rules, type);
  return rule && typeof rule.value === "number" ? rule.value : undefined;
}

export function getRatingRange(validation: ValidationRule[]): RatingRange {
  const min = Math.trunc(getNumericBound(validation, "min") ?? 1);
  const max = Math.trunc(getNumericBound(validation, "max") ?? 5);

  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    return { max: 5, min: 1 };
  }

  return { max, min };
}

export function getFieldOptions(
  field: CompiledField
): CompiledOption[] | undefined {
  return "options" in field ? field.options : undefined;
}

// --- Builder Function ---

export function buildFieldValidation(
  field: CompiledField,
  messages?: ValidationMessages
): FieldValidation {
  return {
    registerOptions: buildRegisterOptions(field, messages),
    validate: (value, formData) =>
      executeValidation(field.type, value, field.validation, formData),
  };
}

// --- Section Validation ---

export function validateSectionFields(
  fields: CompiledField[],
  sectionData: Record<string, unknown>,
  formData: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = sectionData[field.id];
    const error = executeValidation(
      field.type,
      value,
      field.validation,
      formData
    );
    if (error) {
      errors[field.id] = error;
    }
  }

  return errors;
}

// --- Internal: Build RegisterOptions ---

function buildRegisterOptions(
  field: CompiledField,
  messages?: ValidationMessages
): RegisterOptions {
  const rules = applyCommonRules(field);
  const validateFns = {
    ...buildFieldTypeValidators(field),
    ...buildExpressionValidators(field.validation),
    ...buildEmailValidators(field, messages),
  };

  if (Object.keys(validateFns).length > 0) {
    rules.validate = validateFns;
  }

  return rules;
}

function applyCommonRules(field: CompiledField): RegisterOptions {
  const rules: RegisterOptions = {};

  for (const rule of field.validation) {
    switch (rule.type) {
      case "required":
        rules.required = rule.message;
        break;
      case "pattern":
        rules.pattern = {
          value: new RegExp(rule.regex),
          message: rule.message,
        };
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

function getSelectionCount(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }

  return value ? 1 : 0;
}

function buildFieldTypeValidators(
  field: CompiledField
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
        if (
          minRule &&
          typeof minRule.value === "number" &&
          num < minRule.value
        ) {
          return minRule.message;
        }
        if (
          maxRule &&
          typeof maxRule.value === "number" &&
          num > maxRule.value
        ) {
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
            : getSelectionCount(value);

        if (field.required && count === 0 && requiredRule) {
          return requiredRule.message;
        }
        if (
          minRule &&
          typeof minRule.value === "number" &&
          count < minRule.value
        ) {
          return minRule.message;
        }
        if (
          maxRule &&
          typeof maxRule.value === "number" &&
          count > maxRule.value
        ) {
          return maxRule.message;
        }
        return true;
      };
      break;
    }
  }

  return validateFns;
}

function buildExpressionValidators(
  validation: ValidationRule[]
): Record<string, Validate<unknown, Record<string, unknown>>> {
  const validators: Record<
    string,
    Validate<unknown, Record<string, unknown>>
  > = {};

  validation.forEach((rule, i) => {
    if (rule.type !== "expression") return;

    validators[`expr_${i}`] = (
      _value: unknown,
      formValues: Record<string, unknown>
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

function buildEmailValidators(
  field: CompiledField,
  messages?: ValidationMessages
): Record<string, Validate<unknown, Record<string, unknown>>> {
  if (field.type !== "email") return {};

  const validators: Record<
    string,
    Validate<unknown, Record<string, unknown>>
  > = {};

  if (field.otp) {
    const otpFieldNames = getOtpFieldNames(field.id);
    validators.otp = (value, formValues) => {
      if (value === undefined || value === null || value === "") return true;
      const values =
        formValues && typeof formValues === "object"
          ? (formValues as Record<string, unknown>)
          : {};
      if (!isOtpVerifiedValue(values[otpFieldNames.verified])) {
        return messages?.emailOtpRequired ?? "";
      }
      return true;
    };
  }

  if (field.block_free_email) {
    validators.blockFreeEmail = (value) => {
      if (!value || typeof value !== "string") return true;
      const domain = value.split("@")[1]?.toLowerCase();
      if (domain && FREE_EMAIL_DOMAINS.has(domain)) {
        return messages?.emailFreeEmailBlocked ?? "";
      }
      return true;
    };
  }

  return validators;
}

// --- Internal: Runtime Validation Execution ---

const ruleHandlers: {
  [K in ValidationRule["type"]]: (
    rule: Extract<ValidationRule, { type: K }>,
    context: {
      fieldType: string;
      value: unknown;
      data: Record<string, unknown>;
    }
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

function executeValidation(
  fieldType: string,
  value: unknown,
  rules: ValidationRule[],
  data: Record<string, unknown>
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
