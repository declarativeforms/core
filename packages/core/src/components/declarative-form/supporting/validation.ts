import type { RegisterOptions } from 'react-hook-form';

import {
  buildFieldMetadata,
  type CompiledField,
  type FieldMetadata,
} from '@declarativeforms/runtime';
import { getEmailValidation } from '../fields/email/validation';

export type ValidationMessages = {
  emailFreeEmailBlocked?: string;
  emailOtpRequired?: string;
};

export type FieldValidation = Omit<FieldMetadata, 'config'> & {
  registerOptions: RegisterOptions;
};
export function buildFieldValidation(
  field: CompiledField,
  messages?: ValidationMessages,
): FieldValidation {
  const { config, ...metadata } = buildFieldMetadata(field);

  const emailValidation = getEmailValidation(field, messages);
  if (emailValidation) {
    const validate = config.validate ?? {};

    if (typeof emailValidation === 'function') {
      (validate as Record<string, unknown>).extension = emailValidation;
    } else {
      Object.assign(validate, emailValidation);
    }

    config.validate = validate;
  }

  return { ...metadata, registerOptions: config as RegisterOptions };
}
