import type {
  DeclarativeFieldType,
  ICompiledValidationRule,
  IResolvedFormValidator,
} from '../types';
import { DEFAULT_MESSAGES, type ValidationMessages } from './messages';
import { interpolateTemplate } from './template';

type BoundValidator = {
  type: 'min' | 'max';
  value: number | string;
  message?: string;
};

function findBoundValidator(
  validators: Array<IResolvedFormValidator>,
  type: 'min' | 'max',
): BoundValidator | undefined {
  return validators.find(
    (validator): validator is BoundValidator =>
      typeof validator === 'object' &&
      validator.type === type &&
      validator.value !== undefined,
  );
}

function hasValidatorOfType(
  validators: Array<IResolvedFormValidator>,
  type: string,
): boolean {
  return validators.some(
    (validator) => typeof validator === 'object' && validator.type === type,
  );
}

function getRatingRange(validators: Array<IResolvedFormValidator>): {
  min: number;
  max: number;
} {
  const minValidator = findBoundValidator(validators, 'min');
  const maxValidator = findBoundValidator(validators, 'max');
  const min =
    minValidator &&
    typeof minValidator.value === 'number' &&
    minValidator.value >= 1
      ? minValidator.value
      : 1;
  const max =
    maxValidator &&
    typeof maxValidator.value === 'number' &&
    maxValidator.value >= min
      ? maxValidator.value
      : 5;

  return { min, max };
}

export function buildValidationRules(
  fieldType: DeclarativeFieldType,
  validators: Array<IResolvedFormValidator>,
  label: string,
  messages: ValidationMessages = DEFAULT_MESSAGES,
): Array<ICompiledValidationRule> {
  const rules: Array<ICompiledValidationRule> = [];

  for (const validator of validators) {
    if (validator === 'required') {
      rules.push({
        type: 'required',
        message: interpolateTemplate(messages.required, {}, { label }),
      });
      continue;
    }

    switch (validator.type) {
      case 'required':
        rules.push({
          type: 'required',
          message:
            validator.message ||
            interpolateTemplate(messages.required, {}, { label }),
        });
        break;
      case 'pattern':
        if (!validator.regex) {
          break;
        }

        rules.push({
          type: 'pattern',
          regex: validator.regex,
          message:
            validator.message ||
            interpolateTemplate(messages.invalid, {}, { label }),
        });
        break;
      case 'min_length':
        if (typeof validator.value !== 'number') {
          break;
        }

        rules.push({
          type: 'min_length',
          value: validator.value,
          message:
            validator.message ||
            interpolateTemplate(
              messages.min_length,
              {},
              { label, min: validator.value },
            ),
        });
        break;
      case 'max_length':
        if (typeof validator.value !== 'number') {
          break;
        }

        rules.push({
          type: 'max_length',
          value: validator.value,
          message:
            validator.message ||
            interpolateTemplate(
              messages.max_length,
              {},
              { label, max: validator.value },
            ),
        });
        break;
      case 'expression':
        if (!validator.expression) {
          break;
        }

        rules.push({
          type: 'expression',
          expression: validator.expression,
          message:
            validator.message ||
            interpolateTemplate(messages.invalid, {}, { label }),
        });
        break;
    }
  }

  const minValidator = findBoundValidator(validators, 'min');
  const maxValidator = findBoundValidator(validators, 'max');

  if (
    fieldType === 'date' ||
    fieldType === 'date_month' ||
    fieldType === 'time'
  ) {
    if (minValidator) {
      rules.push({
        type: 'min',
        value: minValidator.value,
        message:
          minValidator.message ||
          interpolateTemplate(
            messages.date_min,
            {},
            { label, min: String(minValidator.value) },
          ),
      });
    }

    if (maxValidator) {
      rules.push({
        type: 'max',
        value: maxValidator.value,
        message:
          maxValidator.message ||
          interpolateTemplate(
            messages.date_max,
            {},
            { label, max: String(maxValidator.value) },
          ),
      });
    }
  }

  if (fieldType === 'number') {
    if (!hasValidatorOfType(validators, 'pattern')) {
      rules.push({
        type: 'pattern',
        regex: '^\\d+$',
        message: interpolateTemplate(messages.whole_number, {}, { label }),
      });
    }
    if (minValidator && typeof minValidator.value === 'number') {
      rules.push({
        type: 'min',
        value: minValidator.value,
        message:
          minValidator.message ||
          interpolateTemplate(
            messages.number_min,
            {},
            { label, min: minValidator.value },
          ),
      });
    }

    if (maxValidator && typeof maxValidator.value === 'number') {
      rules.push({
        type: 'max',
        value: maxValidator.value,
        message:
          maxValidator.message ||
          interpolateTemplate(
            messages.number_max,
            {},
            { label, max: maxValidator.value },
          ),
      });
    }
  }

  if (fieldType === 'rating') {
    const range = getRatingRange(validators);
    rules.push({
      type: 'min',
      value: range.min,
      message:
        minValidator?.message ||
        interpolateTemplate(messages.number_min, {}, { label, min: range.min }),
    });
    rules.push({
      type: 'max',
      value: range.max,
      message:
        maxValidator?.message ||
        interpolateTemplate(messages.number_max, {}, { label, max: range.max }),
    });
  }

  if (fieldType === 'file_upload') {
    if (minValidator && typeof minValidator.value === 'number') {
      rules.push({
        type: 'min',
        value: minValidator.value,
        message:
          minValidator.message ||
          interpolateTemplate(
            messages.file_min,
            {},
            { label, min: minValidator.value },
          ),
      });
    }

    if (maxValidator && typeof maxValidator.value === 'number') {
      rules.push({
        type: 'max',
        value: maxValidator.value,
        message:
          maxValidator.message ||
          interpolateTemplate(
            messages.file_max,
            {},
            { label, max: maxValidator.value },
          ),
      });
    }
  }

  if (fieldType === 'multiple_select') {
    if (minValidator && typeof minValidator.value === 'number') {
      rules.push({
        type: 'min',
        value: minValidator.value,
        message:
          minValidator.message ||
          interpolateTemplate(
            messages.selection_min,
            {},
            { label, min: minValidator.value },
          ),
      });
    }

    if (maxValidator && typeof maxValidator.value === 'number') {
      rules.push({
        type: 'max',
        value: maxValidator.value,
        message:
          maxValidator.message ||
          interpolateTemplate(
            messages.selection_max,
            {},
            { label, max: maxValidator.value },
          ),
      });
    }
  }

  return rules;
}
