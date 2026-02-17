import type { RegisterOptions } from "react-hook-form";

import type { DeclarativeFieldMeta } from "./field-contract";
import type { IDeclarativeFormField } from "./types";

function getRatingRange(meta: DeclarativeFieldMeta): {
  max: number;
  min: number;
} {
  const min =
    typeof meta.minValidator?.value === "number"
      ? Math.trunc(meta.minValidator.value)
      : 1;
  const max =
    typeof meta.maxValidator?.value === "number"
      ? Math.trunc(meta.maxValidator.value)
      : 5;

  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    return { max: 5, min: 1 };
  }

  return { max, min };
}

export function buildFieldRules(
  field: IDeclarativeFormField,
  meta: DeclarativeFieldMeta
): RegisterOptions {
  const rules: RegisterOptions = {};

  if (field.validators) {
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

  if (
    field.type === "short_text" ||
    field.type === "long_text" ||
    field.type === "email" ||
    field.type === "url"
  ) {
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

  if (field.type === "email" && field.otp) {
    rules.validate = (value, formValues) => {
      if (value === undefined || value === null || value === "") {
        return true;
      }

      const values =
        formValues && typeof formValues === "object"
          ? (formValues as Record<string, unknown>)
          : {};
      const otpVerified =
        values[`${field.id}__otp_verified`] === true ||
        values[`${field.id}__otp_verified`] === "true";

      if (!otpVerified) {
        return "Please verify your email address with OTP.";
      }

      return true;
    };
  }

  if (field.type === "date") {
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

  if (field.type === "number") {
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

  if (field.type === "rating") {
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

  if (field.type === "file_upload") {
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

  if (field.type === "multiple_select") {
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

  return rules;
}
