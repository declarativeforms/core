import {
  type IDeclarativeForm,
  validateFormDefinition as validateCoreFormDefinition,
} from '@declarativeforms/core';

export class InvalidFormDefinitionError extends Error {
  constructor(public readonly details: Array<string>) {
    super('The form definition is invalid.');
    this.name = 'InvalidFormDefinitionError';
  }
}

export function parseFormDefinition(value: unknown): IDeclarativeForm {
  const errors = validateFormDefinition(value);

  if (errors.length > 0) {
    throw new InvalidFormDefinitionError(errors);
  }

  return value as IDeclarativeForm;
}

export function validateFormDefinition(value: unknown): Array<string> {
  return validateCoreFormDefinition(value);
}
