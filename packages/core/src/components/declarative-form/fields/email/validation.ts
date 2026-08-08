import type { RegisterOptions, Validate } from 'react-hook-form';

import type { IRenderableField } from '@declarativeforms/engine';
import { FREE_EMAIL_DOMAINS } from './free-email-domains';
import { getSecondaryValidationTokenFieldName } from '../secondary-token-field';

export type EmailValidationMessages = {
  emailFreeEmailBlocked?: string;
  emailOtpRequired?: string;
};

export function getEmailValidation(
  field: IRenderableField,
  messages?: EmailValidationMessages,
): RegisterOptions['validate'] | undefined {
  if (field.type !== 'email') return undefined;

  const validators: Record<
    string,
    Validate<unknown, Record<string, unknown>>
  > = {};

  if (field.blockFreeEmail) {
    validators.blockFreeEmail = (value) => {
      if (!value || typeof value !== 'string') return true;
      const domain = value.split('@')[1]?.toLowerCase();
      if (domain && FREE_EMAIL_DOMAINS.has(domain)) {
        return messages?.emailFreeEmailBlocked ?? '';
      }
      return true;
    };
  }

  if (field.otpEnabled) {
    validators.otpVerified = (_value, formValues) => {
      const tokenFieldName =
        field.tokenFieldName ?? getSecondaryValidationTokenFieldName(field.id);
      const verificationToken = formValues[tokenFieldName];

      if (typeof verificationToken === 'string' && verificationToken.trim()) {
        return true;
      }

      return messages?.emailOtpRequired ?? '';
    };
  }

  return Object.keys(validators).length > 0 ? validators : undefined;
}
