import type { RegisterOptions } from "react-hook-form";

import { findValidationRule } from "./field-contract";
import { getOtpFieldNames, isOtpVerifiedValue } from "./otp-field-names";
import type { CompiledField } from "../runtime/types";

export function validationRulesToRegisterOptions(
  field: CompiledField,
): RegisterOptions {
  const rules: RegisterOptions = {};

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

      rules.validate = (value) => {
        if (value === undefined || value === null || value === "") return true;

        const num = Number(value);
        if (!Number.isFinite(num) || !Number.isInteger(num)) {
          return patternRule?.message ?? `${field.label} must be a whole number`;
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

      rules.validate = (value) => {
        if (value === undefined || value === null || value === "") return true;

        const num = Number(value);
        if (!Number.isFinite(num) || !Number.isInteger(num)) {
          return `${field.label} must be a whole number`;
        }
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

      rules.validate = (value) => {
        const count = Array.isArray(value) ? value.length : value ? 1 : 0;

        if (field.required && count === 0) {
          return requiredRule?.message ?? `${field.label} is required`;
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

      rules.validate = (value) => {
        const count = Array.isArray(value) ? value.length : 0;

        if (field.required && count === 0) {
          return requiredRule?.message ?? `${field.label} is required`;
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

    case "email": {
      if (field.otp) {
        const otpFieldNames = getOtpFieldNames(field.id);
        rules.validate = (value, formValues) => {
          if (value === undefined || value === null || value === "") return true;
          const values =
            formValues && typeof formValues === "object"
              ? (formValues as Record<string, unknown>)
              : {};
          if (!isOtpVerifiedValue(values[otpFieldNames.verified])) {
            return "Email verification is required";
          }
          return true;
        };
      }
      break;
    }
  }

  return rules;
}
