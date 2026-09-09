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

function getBoundValidator(
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

function hasValidator(
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
  const minVal = getBoundValidator(validators, 'min');
  const maxVal = getBoundValidator(validators, 'max');
  const min =
    minVal && typeof minVal.value === 'number' && minVal.value >= 1
      ? minVal.value
      : 1;
  const max =
    maxVal && typeof maxVal.value === 'number' && maxVal.value >= min
      ? maxVal.value
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

  const minVal = getBoundValidator(validators, 'min');
  const maxVal = getBoundValidator(validators, 'max');

  if (
    fieldType === 'date' ||
    fieldType === 'date_month' ||
    fieldType === 'time'
  ) {
    if (minVal) {
      rules.push({
        type: 'min',
        value: minVal.value,
        message:
          minVal.message ||
          interpolateTemplate(
            messages.date_min,
            {},
            { label, min: String(minVal.value) },
          ),
      });
    }
    if (maxVal) {
      rules.push({
        type: 'max',
        value: maxVal.value,
        message:
          maxVal.message ||
          interpolateTemplate(
            messages.date_max,
            {},
            { label, max: String(maxVal.value) },
          ),
      });
    }
  }

  if (fieldType === 'number') {
    if (!hasValidator(validators, 'pattern')) {
      rules.push({
        type: 'pattern',
        regex: '^\\d+$',
        message: interpolateTemplate(messages.whole_number, {}, { label }),
      });
    }
    if (minVal && typeof minVal.value === 'number') {
      rules.push({
        type: 'min',
        value: minVal.value,
        message:
          minVal.message ||
          interpolateTemplate(
            messages.number_min,
            {},
            { label, min: minVal.value },
          ),
      });
    }
    if (maxVal && typeof maxVal.value === 'number') {
      rules.push({
        type: 'max',
        value: maxVal.value,
        message:
          maxVal.message ||
          interpolateTemplate(
            messages.number_max,
            {},
            { label, max: maxVal.value },
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
        minVal?.message ||
        interpolateTemplate(messages.number_min, {}, { label, min: range.min }),
    });
    rules.push({
      type: 'max',
      value: range.max,
      message:
        maxVal?.message ||
        interpolateTemplate(messages.number_max, {}, { label, max: range.max }),
    });
  }

  if (fieldType === 'file_upload') {
    if (minVal && typeof minVal.value === 'number') {
      rules.push({
        type: 'min',
        value: minVal.value,
        message:
          minVal.message ||
          interpolateTemplate(
            messages.file_min,
            {},
            { label, min: minVal.value },
          ),
      });
    }
    if (maxVal && typeof maxVal.value === 'number') {
      rules.push({
        type: 'max',
        value: maxVal.value,
        message:
          maxVal.message ||
          interpolateTemplate(
            messages.file_max,
            {},
            { label, max: maxVal.value },
          ),
      });
    }
  }

  if (fieldType === 'multiple_select') {
    if (minVal && typeof minVal.value === 'number') {
      rules.push({
        type: 'min',
        value: minVal.value,
        message:
          minVal.message ||
          interpolateTemplate(
            messages.selection_min,
            {},
            { label, min: minVal.value },
          ),
      });
    }
    if (maxVal && typeof maxVal.value === 'number') {
      rules.push({
        type: 'max',
        value: maxVal.value,
        message:
          maxVal.message ||
          interpolateTemplate(
            messages.selection_max,
            {},
            { label, max: maxVal.value },
          ),
      });
    }
  }

  return rules;
}
