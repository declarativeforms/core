import type { RegisterOptions, Validate } from "react-hook-form";

import type { CompiledField } from "@declarativeforms/runtime";
import { FREE_EMAIL_DOMAINS } from "./free-email-domains";

export type EmailValidationMessages = {
  emailFreeEmailBlocked?: string;
};

export function getEmailValidation(
  field: CompiledField,
  messages?: EmailValidationMessages
): RegisterOptions["validate"] | undefined {
  if (field.type !== "email") return undefined;

  const validators: Record<string, Validate<unknown, Record<string, unknown>>> = {};

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
