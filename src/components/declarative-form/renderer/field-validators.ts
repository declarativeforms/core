import type { RegisterOptions } from "react-hook-form";

import type { CompiledField } from "../runtime/types";
import type { ValidationMessages } from "./field-validation";
import { getEmailValidation } from "../fields/email/validation";

export type FieldValidationExtension = (
  field: CompiledField,
  messages?: ValidationMessages,
) => RegisterOptions["validate"] | undefined;

export const fieldValidationExtensions: Partial<
  Record<CompiledField["type"], FieldValidationExtension>
> = {
  email: getEmailValidation,
};
