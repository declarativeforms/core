import type { RegisterOptions, Validate } from 'react-hook-form';

import type { CompiledField } from '@declarativeforms/core';
import { FREE_EMAIL_DOMAINS } from './free-email-domains';
import { getSecondaryValidationTokenFieldName } from '../secondary-token-field';

export type EmailValidationMessages = {
  emailFreeEmailBlocked?: string;
  emailOtpRequired?: string;
};

export function getEmailValidation(
  field: CompiledField,
  messages?: EmailValidationMessages,
): RegisterOptions['validate'] | undefined {
  if (field.type !== 'email') return undefined;

  const validators: Record<
    string,
    Validate<unknown, Record<string, unknown>>
  > = {};

  if (field.block_free_email) {
    validators.blockFreeEmail = (value) => {
      if (!value || typeof value !== 'string') return true;
      const domain = value.split('@')[1]?.toLowerCase();
      if (domain && FREE_EMAIL_DOMAINS.has(domain)) {
        return messages?.emailFreeEmailBlocked ?? '';
      }
      return true;
    };
  }

  if (field.otp) {
    validators.otpVerified = (_value, formValues) => {
      const tokenFieldName = getSecondaryValidationTokenFieldName(field.id);
      const verificationToken = formValues[tokenFieldName];

      if (typeof verificationToken === 'string' && verificationToken.trim()) {
        return true;
      }

      return messages?.emailOtpRequired ?? '';
    };
  }

  return Object.keys(validators).length > 0 ? validators : undefined;
}
