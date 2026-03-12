import type { RegisterOptions } from "react-hook-form";

import type { CompiledField } from "../../runtime/types";
import type { ValidationMessages } from "../../renderer/field-validation";
import { getOtpFieldNames, isOtpVerifiedValue } from "./otp-field-names";

export function getEmailOtpValidation(
  field: CompiledField,
  messages?: ValidationMessages,
): RegisterOptions["validate"] | undefined {
  if (field.type !== "email" || !field.otp) return undefined;

  const otpFieldNames = getOtpFieldNames(field.id);
  return (value, formValues) => {
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
