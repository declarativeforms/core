import type { RegisterOptions } from "react-hook-form";

import type { DeclarativeFieldMeta } from "./field-contract";
import type { IResolvedDeclarativeFormField } from "./localized-content";
import { getOtpFieldNames, isOtpVerifiedValue } from "./otp-field-names";
import { getRatingRange } from "./rating-range";

function applyRequiredAndPatternRules(
  field: IResolvedDeclarativeFormField,
  rules: RegisterOptions
) {
  if (!field.validators) {
    return;
  }

  for (const validator of field.validators) {
    if (validator === "required") {
      rules.required = `${field.label} is required.`;
    } else if (typeof validator === "object" && validator.type === "pattern") {
      rules.pattern = {
        value: new RegExp(validator.regex),
        message: validator.message || `${field.label} is invalid.`,
      };
    }
  }
}

function applyTextLengthRules(
  field: IResolvedDeclarativeFormField,
  meta: DeclarativeFieldMeta,
  rules: RegisterOptions
) {
  const isTextField =
    field.type === "short_text" ||
    field.type === "long_text" ||
    field.type === "email" ||
    field.type === "url";

  if (!isTextField) {
    return;
  }

  if (meta.minValidator && typeof meta.minValidator.value === "number") {
    rules.minLength = {
      value: meta.minValidator.value,
      message:
        meta.minValidator.message ||
        `${field.label} must be at least ${meta.minValidator.value} characters.`,
    };
  }
  if (meta.maxValidator && typeof meta.maxValidator.value === "number") {
    rules.maxLength = {
      value: meta.maxValidator.value,
      message:
        meta.maxValidator.message ||
        `${field.label} must be at most ${meta.maxValidator.value} characters.`,
    };
  }
}

function applyEmailOtpRules(
  field: IResolvedDeclarativeFormField,
  rules: RegisterOptions
) {
  if (!(field.type === "email" && field.otp)) {
    return;
  }

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
      return "Please verify your email address with OTP.";
    }

    return true;
  };
}

function applyDateRules(
  field: IResolvedDeclarativeFormField,
  meta: DeclarativeFieldMeta,
  rules: RegisterOptions
) {
  if (field.type !== "date") {
    return;
  }

  if (meta.minValidator) {
    rules.min = {
      value: meta.minValidator.value,
      message:
        meta.minValidator.message ||
        `${field.label} must be on or after ${meta.minValidator.value}.`,
    };
  }
  if (meta.maxValidator) {
    rules.max = {
      value: meta.maxValidator.value,
      message:
        meta.maxValidator.message ||
        `${field.label} must be on or before ${meta.maxValidator.value}.`,
    };
  }
}

function applyNumberRules(
  field: IResolvedDeclarativeFormField,
  meta: DeclarativeFieldMeta,
  rules: RegisterOptions
) {
  if (field.type !== "number") {
    return;
  }

  if (!meta.hasPatternValidator) {
    rules.pattern = {
      value: /^\d+$/,
      message: `${field.label} must be a whole number.`,
    };
  }

  rules.validate = (value) => {
    if (value === undefined || value === null || value === "") {
      return true;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || !Number.isInteger(numericValue)) {
      return `${field.label} must be a whole number.`;
    }

    if (
      meta.minValidator &&
      typeof meta.minValidator.value === "number" &&
      numericValue < meta.minValidator.value
    ) {
      return (
        meta.minValidator.message ||
        `${field.label} must be at least ${meta.minValidator.value}.`
      );
    }

    if (
      meta.maxValidator &&
      typeof meta.maxValidator.value === "number" &&
      numericValue > meta.maxValidator.value
    ) {
      return (
        meta.maxValidator.message ||
        `${field.label} must be at most ${meta.maxValidator.value}.`
      );
    }

    return true;
  };
}

function applyRatingRules(
  field: IResolvedDeclarativeFormField,
  meta: DeclarativeFieldMeta,
  rules: RegisterOptions
) {
  if (field.type !== "rating") {
    return;
  }

  const { min, max } = getRatingRange(meta);
  rules.validate = (value) => {
    if (value === undefined || value === null || value === "") {
      return true;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || !Number.isInteger(numericValue)) {
      return `${field.label} must be a whole number.`;
    }

    if (numericValue < min) {
      return meta.minValidator?.message || `${field.label} must be at least ${min}.`;
    }

    if (numericValue > max) {
      return meta.maxValidator?.message || `${field.label} must be at most ${max}.`;
    }

    return true;
  };
}

function applyFileUploadRules(
  field: IResolvedDeclarativeFormField,
  meta: DeclarativeFieldMeta,
  rules: RegisterOptions
) {
  if (field.type !== "file_upload") {
    return;
  }

  rules.validate = (value) => {
    const fileCount = Array.isArray(value) ? value.length : value ? 1 : 0;

    if (meta.isRequired && fileCount === 0) {
      return `${field.label} is required.`;
    }

    if (
      meta.minValidator &&
      typeof meta.minValidator.value === "number" &&
      fileCount < meta.minValidator.value
    ) {
      return (
        meta.minValidator.message ||
        `${field.label} requires at least ${meta.minValidator.value} file${meta.minValidator.value > 1 ? "s" : ""}.`
      );
    }

    if (
      meta.maxValidator &&
      typeof meta.maxValidator.value === "number" &&
      fileCount > meta.maxValidator.value
    ) {
      return (
        meta.maxValidator.message ||
        `${field.label} allows at most ${meta.maxValidator.value} file${meta.maxValidator.value > 1 ? "s" : ""}.`
      );
    }

    return true;
  };
}

function applyMultipleSelectRules(
  field: IResolvedDeclarativeFormField,
  meta: DeclarativeFieldMeta,
  rules: RegisterOptions
) {
  if (field.type !== "multiple_select") {
    return;
  }

  rules.validate = (value) => {
    const selections = Array.isArray(value) ? value.length : 0;

    if (meta.isRequired && selections === 0) {
      return `${field.label} is required.`;
    }

    if (
      meta.minValidator &&
      typeof meta.minValidator.value === "number" &&
      selections < meta.minValidator.value
    ) {
      return (
        meta.minValidator.message ||
        `${field.label} requires at least ${meta.minValidator.value} selection${meta.minValidator.value > 1 ? "s" : ""}.`
      );
    }

    if (
      meta.maxValidator &&
      typeof meta.maxValidator.value === "number" &&
      selections > meta.maxValidator.value
    ) {
      return (
        meta.maxValidator.message ||
        `${field.label} allows at most ${meta.maxValidator.value} selection${meta.maxValidator.value > 1 ? "s" : ""}.`
      );
    }

    return true;
  };
}

export function buildFieldRules(
  field: IResolvedDeclarativeFormField,
  meta: DeclarativeFieldMeta
): RegisterOptions {
  const rules: RegisterOptions = {};

  applyRequiredAndPatternRules(field, rules);
  applyTextLengthRules(field, meta, rules);
  applyEmailOtpRules(field, rules);
  applyDateRules(field, meta, rules);
  applyNumberRules(field, meta, rules);
  applyRatingRules(field, meta, rules);
  applyFileUploadRules(field, meta, rules);
  applyMultipleSelectRules(field, meta, rules);

  return rules;
}
