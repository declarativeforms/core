import type { RegisterOptions } from 'react-hook-form';

import { validateField, type IRenderableField } from '@declarativeforms/engine';
import { getEmailValidation } from '../fields/email/validation';

// TODO: Ideally these ValidationMessage should not be this tightly couples to the fields or in this case email fields. It should rather be implemented as a much more flexible and dynamic way.
export type ValidationMessages = {
  emailFreeEmailBlocked?: string;
  emailOtpRequired?: string;
};

// TODO: move these types into their own file
type FieldValidator = (
  value: unknown,
  values: Record<string, unknown>,
) => true | string;

/**
 * Turn a renderable field into react-hook-form `RegisterOptions`. The engine
 * owns rule evaluation (`validateField`); this just wraps it, plus the two
 * app-specific email gates (free-email domains, OTP token).
 */
export function buildFieldValidation(
  field: IRenderableField,
  messages?: ValidationMessages,
): RegisterOptions {
  const validate: Record<string, FieldValidator> = {
    rules: (value, values) => validateField(field, value, values) ?? true,
  };

  const emailValidators = getEmailValidation(field, messages);
  if (emailValidators && typeof emailValidators === 'object') {
    Object.assign(validate, emailValidators);
  }

  return { validate } as RegisterOptions;
}
