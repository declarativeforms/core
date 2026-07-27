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

export function sanitizeFormDefinition(value: unknown): IDeclarativeForm {
  const definition = parseFormDefinition(value);
  const {
    id: _id,
    created_at: _createdAt,
    updated_at: _updatedAt,
    collaborators: _collaborators,
    _id: _mongoId,
    ...safeDefinition
  } = definition as IDeclarativeForm & Record<string, unknown>;

  return safeDefinition;
}

export function validateFormDefinition(value: unknown): Array<string> {
  if (!isRecord(value)) {
    return ['The request body must be a JSON object.'];
  }

  if (!Array.isArray(value.sections)) {
    return ['sections must be an array'];
  }

  const shapeErrors: Array<string> = [];

  for (const [sectionIndex, sectionValue] of value.sections.entries()) {
    if (!isRecord(sectionValue)) {
      shapeErrors.push(`sections[${sectionIndex}] must be an object`);
      continue;
    }

    if (
      sectionValue.fields !== undefined &&
      !Array.isArray(sectionValue.fields)
    ) {
      shapeErrors.push(`sections[${sectionIndex}].fields must be an array`);
    }

    for (const [fieldIndex, fieldValue] of (
      Array.isArray(sectionValue.fields) ? sectionValue.fields : []
    ).entries()) {
      if (!isRecord(fieldValue)) {
        shapeErrors.push(
          `sections[${sectionIndex}].fields[${fieldIndex}] must be an object`,
        );
      }
    }

    if (
      sectionValue.next !== undefined &&
      typeof sectionValue.next !== 'string' &&
      !Array.isArray(sectionValue.next)
    ) {
      shapeErrors.push(
        `sections[${sectionIndex}].next must be a string or an array`,
      );
    }

    if (Array.isArray(sectionValue.next)) {
      for (const [ruleIndex, rule] of sectionValue.next.entries()) {
        if (!isRecord(rule)) {
          shapeErrors.push(
            `sections[${sectionIndex}].next[${ruleIndex}] must be an object`,
          );
        }
      }
    }
  }

  if (shapeErrors.length > 0) {
    return shapeErrors;
  }

  return validateCoreFormDefinition(value as IDeclarativeForm);
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
