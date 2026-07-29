import {
  isDeclarativeConnectionType,
  isDeclarativeFieldType,
} from './definition';
import { isSupportedExpression } from './expression';

type UnknownRecord = Record<string, unknown>;

const VALIDATOR_TYPES = new Set([
  'required',
  'pattern',
  'min',
  'max',
  'min_length',
  'max_length',
  'expression',
]);

const FORM_KEYS = new Set([
  'completion',
  'connections',
  'description',
  'end_date',
  'id',
  'locale',
  'measurements',
  'sections',
  'start_date',
  'theme',
  'title',
  'version',
]);
const SECTION_KEYS = new Set(['fields', 'id', 'next', 'title']);
const FIELD_BASE_KEYS = [
  'id',
  'label',
  'placeholder',
  'type',
  'validators',
  'visible_when',
];

export function validateFormDefinition(definition: unknown): string[] {
  if (!isRecord(definition)) {
    return ['The form definition must be an object'];
  }

  const errors: string[] = [];
  validateKnownKeys(definition, FORM_KEYS, '', errors);

  if (definition.version !== undefined && definition.version !== 1) {
    errors.push('version must be 1');
  }

  validateLocalizedText(definition.title, 'title', errors);
  validateLocalizedText(definition.description, 'description', errors);

  if (!Array.isArray(definition.sections)) {
    return [...errors, 'sections must be an array'];
  }

  if (definition.sections.length === 0) {
    return [...errors, 'sections must contain at least one section'];
  }
  if (definition.sections.length > 100) {
    errors.push('sections must contain at most 100 sections');
  }

  const sectionIds = new Set<string>();
  const fieldIds = new Set<string>();

  for (const [sectionIndex, value] of definition.sections.entries()) {
    const sectionPath = `sections[${sectionIndex}]`;
    if (!isRecord(value)) {
      errors.push(`${sectionPath} must be an object`);
      continue;
    }
    validateKnownKeys(value, SECTION_KEYS, sectionPath, errors);

    const sectionId = validateId(value.id, `${sectionPath}.id`, errors);
    if (sectionId) {
      if (sectionIds.has(sectionId)) {
        errors.push(`${sectionPath}.id must be unique`);
      } else {
        sectionIds.add(sectionId);
      }
    }

    validateLocalizedText(value.title, `${sectionPath}.title`, errors);

    if (!Array.isArray(value.fields)) {
      errors.push(`${sectionPath}.fields must be an array`);
      continue;
    }
    if (value.fields.length > 500) {
      errors.push(`${sectionPath}.fields must contain at most 500 fields`);
    }

    for (const [fieldIndex, fieldValue] of value.fields.entries()) {
      const fieldPath = `${sectionPath}.fields[${fieldIndex}]`;
      if (!isRecord(fieldValue)) {
        errors.push(`${fieldPath} must be an object`);
        continue;
      }
      validateKnownKeys(
        fieldValue,
        getAllowedFieldKeys(fieldValue.type),
        fieldPath,
        errors,
      );

      const fieldId = validateId(fieldValue.id, `${fieldPath}.id`, errors);
      if (fieldId) {
        if (fieldId.endsWith('_token')) {
          errors.push(
            `${fieldPath}.id must not end with reserved suffix "_token"`,
          );
        }
        if (fieldIds.has(fieldId)) {
          errors.push(`${fieldPath}.id must be unique`);
        } else {
          fieldIds.add(fieldId);
        }
      }

      if (!isDeclarativeFieldType(fieldValue.type)) {
        errors.push(`${fieldPath}.type is not supported`);
        continue;
      }

      validateLocalizedText(fieldValue.label, `${fieldPath}.label`, errors);
      validateLocalizedText(
        fieldValue.placeholder,
        `${fieldPath}.placeholder`,
        errors,
      );
      validateExpression(
        fieldValue.visible_when,
        `${fieldPath}.visible_when`,
        errors,
      );
      validateValidators(fieldValue, fieldPath, errors);
      validateFieldOptions(fieldValue, fieldPath, errors);
      validateFieldConfiguration(fieldValue, fieldPath, errors);
    }
  }

  for (const [sectionIndex, section] of definition.sections.entries()) {
    if (isRecord(section)) {
      validateNext(section.next, sectionIndex, sectionIds, errors);
    }
  }

  validateCompletion(definition.completion, errors);
  validateConnections(definition.connections, errors);
  validateDateWindow(definition, errors);

  if (
    definition.locale !== undefined &&
    (typeof definition.locale !== 'string' || !definition.locale.trim())
  ) {
    errors.push('locale must be a non-empty string');
  }

  if (definition.theme !== undefined) {
    if (!isRecord(definition.theme)) {
      errors.push('theme must be an object');
    } else {
      validateKnownKeys(
        definition.theme,
        new Set(['primary']),
        'theme',
        errors,
      );
      if (
        definition.theme.primary !== undefined &&
        typeof definition.theme.primary !== 'string'
      ) {
        errors.push('theme.primary must be a string');
      }
    }
  }

  if (definition.measurements !== undefined) {
    if (!isRecord(definition.measurements)) {
      errors.push('measurements must be an object');
    } else {
      validateKnownKeys(
        definition.measurements,
        new Set(['mixpanel']),
        'measurements',
        errors,
      );
      if (
        definition.measurements.mixpanel !== undefined &&
        typeof definition.measurements.mixpanel !== 'string'
      ) {
        errors.push('measurements.mixpanel must be a string');
      }
    }
  }

  return errors;
}

function validateId(
  value: unknown,
  path: string,
  errors: string[],
): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${path} is required`);
    return null;
  }

  if (value.length > 128) {
    errors.push(`${path} must be at most 128 characters`);
  }

  return value;
}

function validateLocalizedText(
  value: unknown,
  path: string,
  errors: string[],
): void {
  if (value === undefined) {
    return;
  }

  if (typeof value === 'string') {
    if (value.length > 10_000) {
      errors.push(`${path} must be at most 10000 characters`);
    }
    return;
  }

  if (
    !isRecord(value) ||
    Object.values(value).some((entry) => typeof entry !== 'string')
  ) {
    errors.push(`${path} must be a string or a locale-to-string object`);
  } else if (
    Object.values(value).some((entry) => String(entry).length > 10_000)
  ) {
    errors.push(`${path} values must be at most 10000 characters`);
  }
}

function validateExpression(
  value: unknown,
  path: string,
  errors: string[],
): void {
  if (value === undefined) {
    return;
  }

  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.length > 1_000 ||
    !isSupportedExpression(value)
  ) {
    errors.push(`${path} must be a supported expression`);
  }
}

function validateValidators(
  field: UnknownRecord,
  fieldPath: string,
  errors: string[],
): void {
  if (field.validators === undefined) {
    return;
  }

  if (!Array.isArray(field.validators)) {
    errors.push(`${fieldPath}.validators must be an array`);
    return;
  }
  if (field.validators.length > 50) {
    errors.push(`${fieldPath}.validators must contain at most 50 validators`);
  }

  for (const [index, validator] of field.validators.entries()) {
    const path = `${fieldPath}.validators[${index}]`;
    if (validator === 'required') {
      continue;
    }

    if (!isRecord(validator) || typeof validator.type !== 'string') {
      errors.push(`${path} must be "required" or a validator object`);
      continue;
    }

    if (!VALIDATOR_TYPES.has(validator.type)) {
      errors.push(`${path}.type is not supported`);
      continue;
    }
    validateKnownKeys(
      validator,
      getAllowedValidatorKeys(validator.type),
      path,
      errors,
    );

    validateLocalizedText(validator.message, `${path}.message`, errors);

    if (validator.type === 'pattern') {
      if (typeof validator.regex !== 'string' || !validator.regex) {
        errors.push(`${path}.regex is required`);
      } else if (
        validator.regex.length > 256 ||
        /\\[1-9]/.test(validator.regex) ||
        /\(\?/.test(validator.regex) ||
        /\([^)]*[*+{][^)]*\)[*+{]/.test(validator.regex) ||
        /[*+}][*+{]/.test(validator.regex)
      ) {
        errors.push(`${path}.regex uses an unsafe or overly complex pattern`);
      } else {
        try {
          new RegExp(validator.regex);
        } catch {
          errors.push(`${path}.regex must be a valid regular expression`);
        }
      }
    }

    if (validator.type === 'expression') {
      validateExpression(validator.expression, `${path}.expression`, errors);
    }

    if (validator.type === 'min' || validator.type === 'max') {
      if (
        (typeof validator.value !== 'number' ||
          !Number.isFinite(validator.value)) &&
        typeof validator.value !== 'string'
      ) {
        errors.push(`${path}.value must be a finite number or string`);
      }
    }

    if (validator.type === 'min_length' || validator.type === 'max_length') {
      if (
        typeof validator.value !== 'number' ||
        !Number.isInteger(validator.value) ||
        validator.value < 0 ||
        validator.value > 100_000
      ) {
        errors.push(`${path}.value must be an integer between 0 and 100000`);
      }
    }
  }
}

function validateFieldOptions(
  field: UnknownRecord,
  fieldPath: string,
  errors: string[],
): void {
  if (field.options === undefined) {
    return;
  }

  if (!Array.isArray(field.options)) {
    errors.push(`${fieldPath}.options must be an array`);
    return;
  }

  if (field.options.length > 1_000) {
    errors.push(`${fieldPath}.options must contain at most 1000 options`);
  }

  const values = new Set<string>();
  for (const [index, option] of field.options.entries()) {
    const path = `${fieldPath}.options[${index}]`;
    let optionValue: string | undefined;

    if (typeof option === 'string') {
      if (!option) {
        errors.push(`${path} must not be empty`);
      }
      optionValue = option;
    } else if (isRecord(option)) {
      validateKnownKeys(option, new Set(['label', 'value']), path, errors);
      validateLocalizedText(option.label, `${path}.label`, errors);
      if (
        option.value !== undefined &&
        (typeof option.value !== 'string' || !option.value)
      ) {
        errors.push(`${path}.value must be a non-empty string`);
      }
      optionValue = typeof option.value === 'string' ? option.value : undefined;
    } else {
      errors.push(`${path} must be a string or option object`);
    }

    if (optionValue) {
      if (values.has(optionValue)) {
        errors.push(`${path}.value must be unique`);
      }
      values.add(optionValue);
    }
  }
}

function validateFieldConfiguration(
  field: UnknownRecord,
  fieldPath: string,
  errors: string[],
): void {
  for (const booleanKey of [
    'allow_other',
    'block_free_email',
    'otp',
    'searchable',
  ]) {
    if (
      field[booleanKey] !== undefined &&
      typeof field[booleanKey] !== 'boolean'
    ) {
      errors.push(`${fieldPath}.${booleanKey} must be a boolean`);
    }
  }

  if (
    field.outputFormat !== undefined &&
    field.outputFormat !== 'string' &&
    field.outputFormat !== 'structured'
  ) {
    errors.push(`${fieldPath}.outputFormat must be "string" or "structured"`);
  }

  if (
    field.facing_mode !== undefined &&
    field.facing_mode !== 'front' &&
    field.facing_mode !== 'rear'
  ) {
    errors.push(`${fieldPath}.facing_mode must be "front" or "rear"`);
  }

  if (field.accepted_mime_types !== undefined) {
    if (
      !Array.isArray(field.accepted_mime_types) ||
      field.accepted_mime_types.some((value) => typeof value !== 'string')
    ) {
      errors.push(
        `${fieldPath}.accepted_mime_types must be an array of strings`,
      );
    } else if (field.accepted_mime_types.length > 50) {
      errors.push(
        `${fieldPath}.accepted_mime_types must contain at most 50 entries`,
      );
    }
  }

  const numericValidators = Array.isArray(field.validators)
    ? field.validators.filter(
        (validator): validator is UnknownRecord =>
          isRecord(validator) &&
          (validator.type === 'min' || validator.type === 'max') &&
          typeof validator.value === 'number',
      )
    : [];
  const min = numericValidators.find((validator) => validator.type === 'min')
    ?.value as number | undefined;
  const max = numericValidators.find((validator) => validator.type === 'max')
    ?.value as number | undefined;

  if (min !== undefined && max !== undefined && min > max) {
    errors.push(`${fieldPath} minimum must not exceed maximum`);
  }

  if (field.type === 'rating' && (max ?? 5) - (min ?? 1) > 100) {
    errors.push(`${fieldPath} rating range must contain at most 101 values`);
  }

  if (
    (field.type === 'file_upload' || field.type === 'multiple_select') &&
    max !== undefined &&
    max > 100
  ) {
    errors.push(`${fieldPath} maximum must not exceed 100`);
  }
}

function validateNext(
  value: unknown,
  sectionIndex: number,
  sectionIds: Set<string>,
  errors: string[],
): void {
  const path = `sections[${sectionIndex}].next`;
  if (value === undefined) {
    return;
  }

  if (typeof value === 'string') {
    validateNextTarget(value, path, sectionIds, errors);
    return;
  }

  if (!Array.isArray(value)) {
    errors.push(`${path} must be a string or an array`);
    return;
  }
  if (value.length > 50) {
    errors.push(`${path} must contain at most 50 navigation rules`);
  }

  let sawElse = false;
  for (const [index, rule] of value.entries()) {
    const rulePath = `${path}[${index}]`;
    if (!isRecord(rule)) {
      errors.push(`${rulePath} must be an object`);
      continue;
    }

    if (typeof rule.else === 'string') {
      validateKnownKeys(rule, new Set(['else']), rulePath, errors);
      if (sawElse) {
        errors.push(`${path} must contain at most one else rule`);
      }
      if (index !== value.length - 1) {
        errors.push(`${rulePath} else rule must be last`);
      }
      sawElse = true;
      validateNextTarget(rule.else, `${rulePath}.else`, sectionIds, errors);
      continue;
    }

    validateKnownKeys(rule, new Set(['go', 'when']), rulePath, errors);
    validateExpression(rule.when, `${rulePath}.when`, errors);
    if (typeof rule.go !== 'string' || !rule.go) {
      errors.push(`${rulePath}.go is required`);
    } else {
      validateNextTarget(rule.go, `${rulePath}.go`, sectionIds, errors);
    }
  }
}

function validateNextTarget(
  target: string,
  path: string,
  sectionIds: Set<string>,
  errors: string[],
): void {
  if (
    target !== 'done' &&
    !target.startsWith('https://') &&
    !sectionIds.has(target)
  ) {
    errors.push(`${path} references unknown section "${target}"`);
  }
}

function validateCompletion(value: unknown, errors: string[]): void {
  if (value === undefined) {
    return;
  }

  const entries = Array.isArray(value) ? value : [value];
  for (const [index, completion] of entries.entries()) {
    const path = Array.isArray(value) ? `completion[${index}]` : 'completion';
    if (!isRecord(completion)) {
      errors.push(`${path} must be an object`);
      continue;
    }
    validateKnownKeys(
      completion,
      new Set(['button', 'message', 'title', 'when']),
      path,
      errors,
    );

    validateExpression(completion.when, `${path}.when`, errors);
    validateLocalizedText(completion.title, `${path}.title`, errors);
    validateLocalizedText(completion.message, `${path}.message`, errors);
    if (completion.button !== undefined) {
      if (!isRecord(completion.button)) {
        errors.push(`${path}.button must be an object`);
      } else {
        validateKnownKeys(
          completion.button,
          new Set(['label', 'url']),
          `${path}.button`,
          errors,
        );
        validateLocalizedText(
          completion.button.label,
          `${path}.button.label`,
          errors,
        );
        validateLocalizedText(
          completion.button.url,
          `${path}.button.url`,
          errors,
        );
      }
    }
  }
}

function validateConnections(value: unknown, errors: string[]): void {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    errors.push('connections must be an array');
    return;
  }
  if (value.length > 50) {
    errors.push('connections must contain at most 50 connections');
  }

  for (const [index, connection] of value.entries()) {
    const path = `connections[${index}]`;
    if (
      !isRecord(connection) ||
      !isDeclarativeConnectionType(connection.type)
    ) {
      errors.push(`${path}.type is not supported`);
      continue;
    }
    validateKnownKeys(
      connection,
      connection.type === 'webhook'
        ? new Set(['type', 'url', 'when'])
        : new Set([
            'body',
            'include_responses',
            'subject',
            'to',
            'type',
            'when',
          ]),
      path,
      errors,
    );

    validateExpression(connection.when, `${path}.when`, errors);

    if (connection.type === 'webhook') {
      if (typeof connection.url !== 'string') {
        errors.push(`${path}.url is required`);
      } else {
        try {
          const url = new URL(connection.url);
          if (url.protocol !== 'https:') {
            errors.push(`${path}.url must use https`);
          }
        } catch {
          errors.push(`${path}.url must be a valid URL`);
        }
      }
    }

    if (connection.type === 'email') {
      if (typeof connection.to !== 'string' || !connection.to.trim()) {
        errors.push(`${path}.to is required`);
      }
      validateLocalizedText(connection.subject, `${path}.subject`, errors);
      validateLocalizedText(connection.body, `${path}.body`, errors);
      if (
        connection.include_responses !== undefined &&
        typeof connection.include_responses !== 'boolean'
      ) {
        errors.push(`${path}.include_responses must be a boolean`);
      }
    }
  }
}

function validateDateWindow(definition: UnknownRecord, errors: string[]): void {
  const dates: Record<string, number> = {};
  for (const key of ['start_date', 'end_date']) {
    const value = definition[key];
    if (value === undefined) {
      continue;
    }
    if (typeof value !== 'string' || !value.trim()) {
      errors.push(`${key} must be a date string`);
      continue;
    }
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) {
      errors.push(`${key} must be a valid date`);
    } else {
      dates[key] = timestamp;
    }
  }

  if (
    dates.start_date !== undefined &&
    dates.end_date !== undefined &&
    dates.start_date > dates.end_date
  ) {
    errors.push('start_date must not be after end_date');
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateKnownKeys(
  value: UnknownRecord,
  allowed: ReadonlySet<string>,
  path: string,
  errors: string[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      errors.push(`${path ? `${path}.` : ''}${key} is not supported`);
    }
  }
}

function getAllowedFieldKeys(type: unknown): ReadonlySet<string> {
  const keys = [...FIELD_BASE_KEYS];

  switch (type) {
    case 'email':
      keys.push('block_free_email', 'otp');
      break;
    case 'dropdown':
      keys.push('options', 'searchable');
      break;
    case 'rating':
      keys.push('max_label', 'min_label');
      break;
    case 'address':
    case 'address_country':
    case 'address_locality':
    case 'address_region':
      keys.push('outputFormat');
      break;
    case 'multiple_select':
    case 'single_select':
      keys.push('allow_other', 'options');
      break;
    case 'camera':
      keys.push('facing_mode');
      break;
    case 'file_upload':
      keys.push('accepted_mime_types');
      break;
  }

  return new Set(keys);
}

function getAllowedValidatorKeys(type: string): ReadonlySet<string> {
  switch (type) {
    case 'required':
      return new Set(['message', 'type']);
    case 'pattern':
      return new Set(['message', 'regex', 'type']);
    case 'expression':
      return new Set(['expression', 'message', 'type']);
    default:
      return new Set(['message', 'type', 'value']);
  }
}
