import type { RegisterOptions } from "react-hook-form";

import type { DeclarativeFieldMeta } from "./field-contract";
import { getOtpFieldNames, isOtpVerifiedValue } from "./otp-field-names";
import type { CompiledField, ValidationRule } from "./runtime/types";

export function validationRulesToRegisterOptions(
  field: CompiledField,
  meta: DeclarativeFieldMeta
): RegisterOptions {
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
        rules.minLength = {
          value: rule.value,
          message: rule.message,
        };
        break;

      case "max_length":
        rules.maxLength = {
          value: rule.value,
          message: rule.message,
        };
        break;
    }
  }

  if (field.type === "date") {
    applyDateRules(field, rules);
  }

  if (field.type === "number") {
    applyNumberRules(field, rules);
  }

  if (field.type === "rating") {
    applyRatingRules(field, rules);
  }

  if (field.type === "file_upload") {
    applyFileUploadRules(field, meta, rules);
  }

  if (field.type === "multiple_select") {
    applyMultipleSelectRules(field, meta, rules);
  }

  if (field.type === "email" && field.otp) {
    applyEmailOtpRules(field, rules);
  }

  return rules;
}

function findRule(
  rules: ValidationRule[],
  type: ValidationRule["type"]
): ValidationRule | undefined {
  return rules.find((r) => r.type === type);
}

function applyDateRules(field: CompiledField, rules: RegisterOptions) {
  const minRule = findRule(field.validation, "min");
  const maxRule = findRule(field.validation, "max");

  if (minRule && minRule.type === "min") {
    rules.min = { value: minRule.value, message: minRule.message };
  }
  if (maxRule && maxRule.type === "max") {
    rules.max = { value: maxRule.value, message: maxRule.message };
  }
}

function applyNumberRules(field: CompiledField, rules: RegisterOptions) {
  const minRule = findRule(field.validation, "min");
  const maxRule = findRule(field.validation, "max");

  rules.validate = (value) => {
    if (value === undefined || value === null || value === "") {
      return true;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || !Number.isInteger(numericValue)) {
      const patternRule = findRule(field.validation, "pattern");
      return patternRule?.message ?? `${field.label} must be a whole number`;
    }

    if (
      minRule &&
      minRule.type === "min" &&
      typeof minRule.value === "number" &&
      numericValue < minRule.value
    ) {
      return minRule.message;
    }

    if (
      maxRule &&
      maxRule.type === "max" &&
      typeof maxRule.value === "number" &&
      numericValue > maxRule.value
    ) {
      return maxRule.message;
    }

    return true;
  };
}

function applyRatingRules(field: CompiledField, rules: RegisterOptions) {
  const minRule = findRule(field.validation, "min");
  const maxRule = findRule(field.validation, "max");

  rules.validate = (value) => {
    if (value === undefined || value === null || value === "") {
      return true;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || !Number.isInteger(numericValue)) {
      return `${field.label} must be a whole number`;
    }

    if (
      minRule &&
      minRule.type === "min" &&
      numericValue < Number(minRule.value)
    ) {
      return minRule.message;
    }

    if (
      maxRule &&
      maxRule.type === "max" &&
      numericValue > Number(maxRule.value)
    ) {
      return maxRule.message;
    }

    return true;
  };
}

function applyFileUploadRules(
  field: CompiledField,
  meta: DeclarativeFieldMeta,
  rules: RegisterOptions
) {
  const minRule = findRule(field.validation, "min");
  const maxRule = findRule(field.validation, "max");

  rules.validate = (value) => {
    const fileCount = Array.isArray(value) ? value.length : value ? 1 : 0;

    if (meta.isRequired && fileCount === 0) {
      const requiredRule = findRule(field.validation, "required");
      return requiredRule?.message ?? `${field.label} is required`;
    }

    if (
      minRule &&
      minRule.type === "min" &&
      typeof minRule.value === "number" &&
      fileCount < minRule.value
    ) {
      return minRule.message;
    }

    if (
      maxRule &&
      maxRule.type === "max" &&
      typeof maxRule.value === "number" &&
      fileCount > maxRule.value
    ) {
      return maxRule.message;
    }

    return true;
  };
}

function applyMultipleSelectRules(
  field: CompiledField,
  meta: DeclarativeFieldMeta,
  rules: RegisterOptions
) {
  const minRule = findRule(field.validation, "min");
  const maxRule = findRule(field.validation, "max");

  rules.validate = (value) => {
    const selections = Array.isArray(value) ? value.length : 0;

    if (meta.isRequired && selections === 0) {
      const requiredRule = findRule(field.validation, "required");
      return requiredRule?.message ?? `${field.label} is required`;
    }

    if (
      minRule &&
      minRule.type === "min" &&
      typeof minRule.value === "number" &&
      selections < minRule.value
    ) {
      return minRule.message;
    }

    if (
      maxRule &&
      maxRule.type === "max" &&
      typeof maxRule.value === "number" &&
      selections > maxRule.value
    ) {
      return maxRule.message;
    }

    return true;
  };
}

function applyEmailOtpRules(field: CompiledField, rules: RegisterOptions) {
  const otpFieldNames = getOtpFieldNames(field.id);

  rules.validate = (value, formValues) => {
    if (value === undefined || value === null || value === "") {
      return true;
    }

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
