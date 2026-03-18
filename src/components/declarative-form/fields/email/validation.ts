import type { RegisterOptions, Validate } from "react-hook-form";

import type { CompiledField } from "../../runtime/types";
import { FREE_EMAIL_DOMAINS } from "./free-email-domains";
import { getOtpFieldNames, isOtpVerifiedValue } from "./otp-field-names";

export type EmailValidationMessages = {
  emailOtpRequired?: string;
  emailFreeEmailBlocked?: string;
};

export function getEmailValidation(
  field: CompiledField,
  messages?: EmailValidationMessages
): RegisterOptions["validate"] | undefined {
  if (field.type !== "email") return undefined;

  const validators: Record<string, Validate<unknown, Record<string, unknown>>> = {};

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

  return Object.keys(validators).length > 0 ? validators : undefined;
}
