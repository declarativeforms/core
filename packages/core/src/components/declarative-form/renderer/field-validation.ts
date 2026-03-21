import type { RegisterOptions, Validate } from "react-hook-form";

import { evaluateValidationExpression } from "../runtime/core/expression";
import { getEmailValidation } from "../fields/email/validation";
import type { CompiledField, ValidationRule } from "../runtime/types";
import { findValidationRule } from "../view-support/field-support";

export type ValidationMessages = {
  emailOtpRequired?: string;
  emailFreeEmailBlocked?: string;
};

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
  validation: ValidationRule[]
): Record<string, Validate<unknown, Record<string, unknown>>> {
  const validators: Record<string, Validate<unknown, Record<string, unknown>>> =
    {};

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

export function validationRulesToRegisterOptions(
  field: CompiledField,
  messages?: ValidationMessages
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
