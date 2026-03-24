import type { RegisterOptions } from "react-hook-form";

import {
  buildFieldMetadata,
  type CompiledField,
  type FieldMetadata,
  type RatingRange,
} from "@declarativeforms/runtime";
import { getEmailValidation } from "./fields/email/validation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ValidationMessages = {
  emailOtpRequired?: string;
  emailFreeEmailBlocked?: string;
};

export type FieldValidation = Omit<FieldMetadata, "config"> & {
  registerOptions: RegisterOptions;
};

// Re-exports for existing consumers
export {
  findValidationRule,
  getNumericRuleValue,
  getNumericBound,
  getFieldOptions,
  getRatingRange,
} from "@declarativeforms/runtime";
export type { RatingRange };

// ---------------------------------------------------------------------------
// Builder — single entry-point for field components and the renderer
// ---------------------------------------------------------------------------

/**
 * Builds the complete validation object for a compiled field.
 *
 * Delegates to the runtime's `buildFieldMetadata()` for framework-agnostic
 * validation config, then injects email-specific validators and returns
 * the result typed as React Hook Form's `RegisterOptions`.
 */
export function buildFieldValidation(
  field: CompiledField,
  messages?: ValidationMessages,
): FieldValidation {
  const { config, ...metadata } = buildFieldMetadata(field);

  // Inject email-specific validators (OTP verification, free email blocking)
  const emailValidation = getEmailValidation(field, messages);
  if (emailValidation) {
    const validate = config.validate ?? {};
    if (typeof emailValidation === "function") {
      (validate as Record<string, unknown>).extension = emailValidation;
    } else {
      Object.assign(validate, emailValidation);
    }
    config.validate = validate;
  }

  // FieldValidationConfig is structurally compatible with RegisterOptions
  return { ...metadata, registerOptions: config as RegisterOptions };
}
