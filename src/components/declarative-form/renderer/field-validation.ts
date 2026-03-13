import type { RegisterOptions, Validate } from "react-hook-form";

import { findValidationRule } from "./field-contract";
import { fieldValidationExtensions } from "./field-validators";
import type { CompiledField, ValidationRule } from "../runtime/types";

export type ValidationMessages = {
  emailOtpRequired?: string;
  emailFreeEmailBlocked?: string;
};

function buildExpressionValidators(
  validation: ValidationRule[]
): Record<string, Validate<unknown, Record<string, unknown>>> {
  const validators: Record<string, Validate<unknown, Record<string, unknown>>> = {};

  validation.forEach((rule, i) => {
    if (rule.type !== "expression") return;

    validators[`expr_${i}`] = (_value: unknown, formValues: Record<string, unknown>) => {
      const data = formValues && typeof formValues === "object" ? formValues : {};
      try {
        const fn = new Function("data", `return ${rule.expression}`);
        return fn(data) ? true : rule.message;
      } catch {
        return rule.message;
      }
    };
  });

  return validators;
}

export function validationRulesToRegisterOptions(
  field: CompiledField,
  messages?: ValidationMessages,
): RegisterOptions {
  const rules: RegisterOptions = {};
  const validateFns: Record<string, Validate<unknown, Record<string, unknown>>> = {};

  // Common rules applicable to all field types
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

  // Field-type-specific validation using discriminated union
  switch (field.type) {
    case "date": {
      const minRule = findValidationRule(field.validation, "min");
      const maxRule = findValidationRule(field.validation, "max");
      if (minRule) rules.min = { value: minRule.value, message: minRule.message };
      if (maxRule) rules.max = { value: maxRule.value, message: maxRule.message };
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

    case "file_upload": {
      const minRule = findValidationRule(field.validation, "min");
      const maxRule = findValidationRule(field.validation, "max");
      const requiredRule = findValidationRule(field.validation, "required");

      validateFns.fieldType = (value) => {
        const count = Array.isArray(value) ? value.length : value ? 1 : 0;

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

    case "multiple_select": {
      const minRule = findValidationRule(field.validation, "min");
      const maxRule = findValidationRule(field.validation, "max");
      const requiredRule = findValidationRule(field.validation, "required");

      validateFns.fieldType = (value) => {
        const count = Array.isArray(value) ? value.length : 0;

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

  // Apply field-type-specific validation extensions (e.g. email OTP)
  const extension = fieldValidationExtensions[field.type];
  if (extension) {
    const validate = extension(field, messages);
    if (validate) {
      if (typeof validate === "function") {
        validateFns.extension = validate;
      } else {
        Object.assign(validateFns, validate);
      }
    }
  }

  // Expression validators
  const exprValidators = buildExpressionValidators(field.validation);
  Object.assign(validateFns, exprValidators);

  if (Object.keys(validateFns).length > 0) {
    rules.validate = validateFns;
  }

  return rules;
}
