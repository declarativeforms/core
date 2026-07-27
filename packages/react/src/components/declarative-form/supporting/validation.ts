import type { RegisterOptions } from 'react-hook-form';

import {
  buildFieldMetadata,
  type CompiledField,
  type FieldMetadata,
} from '@declarativeforms/core';
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
  existingData: Record<string, unknown> = {},
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

  if (config.validate) {
    config.validate = Object.fromEntries(
      Object.entries(config.validate).map(([name, validator]) => [
        name,
        (value: unknown, sectionData: Record<string, unknown>) =>
          validator(value, { ...existingData, ...sectionData }),
      ]),
    );
  }

  return { ...metadata, registerOptions: config as RegisterOptions };
}
