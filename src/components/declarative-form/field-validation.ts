import type { RegisterOptions } from "react-hook-form";

import type { DeclarativeFieldMeta } from "./field-contract";
import type { IResolvedDeclarativeFormField } from "./localized-content";
import { getOtpFieldNames, isOtpVerifiedValue } from "./otp-field-names";
import { getRatingRange } from "./rating-range";
import type { TranslationKey } from "@/i18n/messages/en";
import type { TranslationValues } from "@/i18n/runtime";

type TFn = (key: TranslationKey, values?: TranslationValues) => string;

function applyRequiredAndPatternRules(
  field: IResolvedDeclarativeFormField,
  rules: RegisterOptions,
  t: TFn
) {
  if (!field.validators) {
    return;
  }

  for (const validator of field.validators) {
    if (validator === "required") {
      rules.required = t("validation.required", { label: field.label });
    } else if (typeof validator === "object" && validator.type === "pattern") {
      rules.pattern = {
        value: new RegExp(validator.regex),
        message:
          validator.message ||
          t("validation.invalid", { label: field.label }),
      };
    }
  }
}

function applyTextLengthRules(
  field: IResolvedDeclarativeFormField,
  meta: DeclarativeFieldMeta,
  rules: RegisterOptions,
  t: TFn
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
        t("validation.min_length", {
          label: field.label,
          min: String(meta.minValidator.value),
        }),
    };
  }
  if (meta.maxValidator && typeof meta.maxValidator.value === "number") {
    rules.maxLength = {
      value: meta.maxValidator.value,
      message:
        meta.maxValidator.message ||
        t("validation.max_length", {
          label: field.label,
          max: String(meta.maxValidator.value),
        }),
    };
  }
}

function applyEmailOtpRules(
  field: IResolvedDeclarativeFormField,
  rules: RegisterOptions,
  t: TFn
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
      return t("validation.email_otp_required");
    }

    return true;
  };
}

function applyDateRules(
  field: IResolvedDeclarativeFormField,
  meta: DeclarativeFieldMeta,
  rules: RegisterOptions,
  t: TFn
) {
  if (field.type !== "date") {
    return;
  }

  if (meta.minValidator) {
    rules.min = {
      value: meta.minValidator.value,
      message:
        meta.minValidator.message ||
        t("validation.date_min", {
          label: field.label,
          min: String(meta.minValidator.value),
        }),
    };
  }
  if (meta.maxValidator) {
    rules.max = {
      value: meta.maxValidator.value,
      message:
        meta.maxValidator.message ||
        t("validation.date_max", {
          label: field.label,
          max: String(meta.maxValidator.value),
        }),
    };
  }
}

function applyNumberRules(
  field: IResolvedDeclarativeFormField,
  meta: DeclarativeFieldMeta,
  rules: RegisterOptions,
  t: TFn
) {
  if (field.type !== "number") {
    return;
  }

  if (!meta.hasPatternValidator) {
    rules.pattern = {
      value: /^\d+$/,
      message: t("validation.whole_number", { label: field.label }),
    };
  }

  rules.validate = (value) => {
    if (value === undefined || value === null || value === "") {
      return true;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || !Number.isInteger(numericValue)) {
      return t("validation.whole_number", { label: field.label });
    }

    if (
      meta.minValidator &&
      typeof meta.minValidator.value === "number" &&
      numericValue < meta.minValidator.value
    ) {
      return (
        meta.minValidator.message ||
        t("validation.number_min", {
          label: field.label,
          min: String(meta.minValidator.value),
        })
      );
    }

    if (
      meta.maxValidator &&
      typeof meta.maxValidator.value === "number" &&
      numericValue > meta.maxValidator.value
    ) {
      return (
        meta.maxValidator.message ||
        t("validation.number_max", {
          label: field.label,
          max: String(meta.maxValidator.value),
        })
      );
    }

    return true;
  };
}

function applyRatingRules(
  field: IResolvedDeclarativeFormField,
  meta: DeclarativeFieldMeta,
  rules: RegisterOptions,
  t: TFn
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
      return t("validation.whole_number", { label: field.label });
    }

    if (numericValue < min) {
      return (
        meta.minValidator?.message ||
        t("validation.number_min", {
          label: field.label,
          min: String(min),
        })
      );
    }

    if (numericValue > max) {
      return (
        meta.maxValidator?.message ||
        t("validation.number_max", {
          label: field.label,
          max: String(max),
        })
      );
    }

    return true;
  };
}

function applyFileUploadRules(
  field: IResolvedDeclarativeFormField,
  meta: DeclarativeFieldMeta,
  rules: RegisterOptions,
  t: TFn
) {
  if (field.type !== "file_upload") {
    return;
  }

  rules.validate = (value) => {
    const fileCount = Array.isArray(value) ? value.length : value ? 1 : 0;

    if (meta.isRequired && fileCount === 0) {
      return t("validation.required", { label: field.label });
    }

    if (
      meta.minValidator &&
      typeof meta.minValidator.value === "number" &&
      fileCount < meta.minValidator.value
    ) {
      return (
        meta.minValidator.message ||
        t("validation.file_min", {
          label: field.label,
          min: String(meta.minValidator.value),
        })
      );
    }

    if (
      meta.maxValidator &&
      typeof meta.maxValidator.value === "number" &&
      fileCount > meta.maxValidator.value
    ) {
      return (
        meta.maxValidator.message ||
        t("validation.file_max", {
          label: field.label,
          max: String(meta.maxValidator.value),
        })
      );
    }

    return true;
  };
}

function applyMultipleSelectRules(
  field: IResolvedDeclarativeFormField,
  meta: DeclarativeFieldMeta,
  rules: RegisterOptions,
  t: TFn
) {
  if (field.type !== "multiple_select") {
    return;
  }

  rules.validate = (value) => {
    const selections = Array.isArray(value) ? value.length : 0;

    if (meta.isRequired && selections === 0) {
      return t("validation.required", { label: field.label });
    }

    if (
      meta.minValidator &&
      typeof meta.minValidator.value === "number" &&
      selections < meta.minValidator.value
    ) {
      return (
        meta.minValidator.message ||
        t("validation.selection_min", {
          label: field.label,
          min: String(meta.minValidator.value),
        })
      );
    }

    if (
      meta.maxValidator &&
      typeof meta.maxValidator.value === "number" &&
      selections > meta.maxValidator.value
    ) {
      return (
        meta.maxValidator.message ||
        t("validation.selection_max", {
          label: field.label,
          max: String(meta.maxValidator.value),
        })
      );
    }

    return true;
  };
}

export function buildFieldRules(
  field: IResolvedDeclarativeFormField,
  meta: DeclarativeFieldMeta,
  t: TFn
): RegisterOptions {
  const rules: RegisterOptions = {};

  applyRequiredAndPatternRules(field, rules, t);
  applyTextLengthRules(field, meta, rules, t);
  applyEmailOtpRules(field, rules, t);
  applyDateRules(field, meta, rules, t);
  applyNumberRules(field, meta, rules, t);
  applyRatingRules(field, meta, rules, t);
  applyFileUploadRules(field, meta, rules, t);
  applyMultipleSelectRules(field, meta, rules, t);

  return rules;
}
