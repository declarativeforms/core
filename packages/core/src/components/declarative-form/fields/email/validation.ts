import type { IRenderableField } from '@declarativeforms/engine';

import type { Translate } from '@/i18n';
import { getSecondaryValidationTokenFieldName } from '../secondary-token-field';
import { FREE_EMAIL_DOMAINS } from './free-email-domains';

type FieldValidator = (
  value: unknown,
  values: Record<string, unknown>,
) => true | string;

/**
 * The email field's extra, client-only validators: block free-email domains and
 * require a verified OTP token. Wired in through the field registry, so the
 * generic validation builder never imports the email field.
 */
export function getEmailValidators(
  field: IRenderableField,
  t: Translate,
): Record<string, FieldValidator> | undefined {
  if (field.type !== 'email') {
    return undefined;
  }

  const validators: Record<string, FieldValidator> = {};

  if (field.blockFreeEmail) {
    validators.blockFreeEmail = (value) => {
      if (!value || typeof value !== 'string') {
        return true;
      }
      const domain = value.split('@')[1]?.toLowerCase();
      if (domain && FREE_EMAIL_DOMAINS.has(domain)) {
        return t('validation.email_free_blocked');
      }
      return true;
    };
  }

  if (field.otpEnabled) {
    validators.otpVerified = (_value, values) => {
      const tokenFieldName =
        field.tokenFieldName ?? getSecondaryValidationTokenFieldName(field.id);
      const token = values[tokenFieldName];
      if (typeof token === 'string' && token.trim()) {
        return true;
      }
      return t('validation.email_otp_required');
    };
  }

  return Object.keys(validators).length > 0 ? validators : undefined;
}
