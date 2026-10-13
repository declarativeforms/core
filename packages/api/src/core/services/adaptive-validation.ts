import {
  FORM_JSON_SCHEMA,
  type IDeclarativeAdaptive,
  type IResolvedAdaptive,
  type IResolvedFormField,
} from '@declarativeforms/engine';
import Ajv, { type ValidateFunction } from 'ajv';

const ajv = new Ajv({ strict: false, allErrors: true, ownProperties: true });
const definitions = FORM_JSON_SCHEMA.definitions;
const validateConfiguration = ajv.compile({
  definitions,
  $ref: '#/definitions/adaptive',
});
const validateFields = ajv.compile({
  definitions,
  type: 'array',
  maxItems: 50,
  items: { $ref: '#/definitions/field' },
});
const DECIMAL_PATTERN = '^-?\\d+(\\.\\d+)?$';

export function assertAdaptiveConfiguration(adaptive: IResolvedAdaptive): void {
  if (
    !validateConfiguration(adaptive) ||
    adaptive.objectives.some((objective) => !objective.trim()) ||
    (adaptive.required ?? []).some(
      (key) => !Object.hasOwn(adaptive.properties, key),
    )
  ) {
    throw new Error('Invalid adaptive configuration');
  }

  buildAdaptiveOutputValidator(adaptive);
}

function buildAdaptiveOutputValidator(
  adaptive: IDeclarativeAdaptive,
): ValidateFunction<Record<string, unknown>> {
  return new Ajv({
    strict: true,
    strictRequired: true,
    allErrors: true,
    ownProperties: true,
  }).compile({
    type: 'object',
    properties: adaptive.properties,
    required: adaptive.required ?? Object.keys(adaptive.properties),
    additionalProperties: false,
  });
}

export function areAdaptiveOutputsValid(
  adaptive: IDeclarativeAdaptive,
  outputs: Record<string, unknown>,
): boolean {
  return buildAdaptiveOutputValidator(adaptive)(outputs);
}

export function isAdaptiveAssessmentComplete(
  adaptive: IDeclarativeAdaptive,
  assessment: { objectives: Array<boolean>; outputs: Record<string, unknown> },
): boolean {
  return (
    assessment.objectives.length === adaptive.objectives.length &&
    assessment.objectives.every(Boolean) &&
    areAdaptiveOutputsValid(adaptive, assessment.outputs)
  );
}

function assertGeneratedContentSafe(content: unknown): void {
  if (
    typeof content === 'string' &&
    (content.includes('{{') || content.includes('<'))
  ) {
    throw new Error('Generated content cannot contain templates or HTML');
  }

  if (Array.isArray(content)) {
    for (const child of content) {
      assertGeneratedContentSafe(child);
    }
  } else if (content && typeof content === 'object') {
    for (const [key, child] of Object.entries(content)) {
      if (
        [
          '__proto__',
          'constructor',
          'prototype',
          'visible_when',
          'expression',
          'next',
          'depends_on',
          'options_by_parent',
          'otp',
        ].includes(key)
      ) {
        throw new Error('Generated content contains an unauthorized property');
      }

      assertGeneratedContentSafe(child);
    }
  }
}

export function parseAdaptiveFields(
  content: string,
): Array<IResolvedFormField> {
  const fields: unknown = JSON.parse(content);
  assertGeneratedContentSafe(fields);

  if (!validateFields(fields)) {
    throw new Error('Invalid generated fields');
  }

  const questions = fields as Array<IResolvedFormField>;
  const identifiers = new Set<string>();

  for (const field of questions) {
    if (
      !field.id ||
      identifiers.has(field.id) ||
      field.id.endsWith('_token') ||
      ['__proto__', 'constructor', 'prototype'].includes(field.id) ||
      field.type === 'hidden' ||
      field.type === 'turnstile'
    ) {
      throw new Error('Invalid generated field identifier or type');
    }

    for (const validator of field.validators ?? []) {
      if (
        typeof validator === 'object' &&
        (validator.type === 'expression' ||
          (validator.type === 'pattern' && validator.regex !== DECIMAL_PATTERN))
      ) {
        throw new Error(
          'Generated validators cannot execute expressions or arbitrary patterns',
        );
      }
    }

    identifiers.add(field.id);
  }

  return questions;
}
