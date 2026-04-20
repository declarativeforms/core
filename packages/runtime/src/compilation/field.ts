import type {
  IDeclarativeFormField,
  IDeclarativeFormOption,
} from '@declarativeforms/types';
import { isDeclarativeFieldType } from '@declarativeforms/types';
import {
  evaluateExpression,
  interpolateTemplate,
  resolveLocalizedText,
} from '@declarativeforms/common';
import type { CompiledField, CompiledOption } from '../types';
import { DEFAULT_MESSAGES, type ValidationMessages } from '../messages';
import { buildValidationRules } from '../validation';

function resolveAndInterpolate(
  text: IDeclarativeFormField['label'],
  locale: string,
  data: Record<string, unknown>,
): string | undefined {
  const resolved = resolveLocalizedText(text, locale);

  if (!resolved) {
    return undefined;
  }

  return interpolateTemplate(resolved, data);
}

function compileOption(
  option: IDeclarativeFormOption,
  locale: string,
  data: Record<string, unknown>,
): CompiledOption {
  if (typeof option === 'string') {
    return { label: interpolateTemplate(option, data), value: option };
  }

  const label = option.label
    ? interpolateTemplate(resolveLocalizedText(option.label, locale), data)
    : '';
  const optionValue = option.value ?? label;

  return {
    label: label || optionValue || '',
    value: optionValue || '',
  };
}

export function compileField(
  field: IDeclarativeFormField,
  locale: string,
  data: Record<string, unknown>,
  messages: ValidationMessages = DEFAULT_MESSAGES,
): CompiledField | null {
  if (!isDeclarativeFieldType(field.type)) {
    return null;
  }

  const label = interpolateTemplate(
    resolveLocalizedText(field.label, locale),
    data,
  );
  const validation = buildValidationRules(
    field.type,
    field.validators ?? [],
    label,
    locale,
    messages,
  );

  const base = {
    id: field.id ?? '',
    label,
    placeholder: resolveAndInterpolate(field.placeholder, locale, data),
    required: validation.some((rule) => rule.type === 'required'),
    visible: field.visible_when
      ? evaluateExpression(field.visible_when, data)
      : true,
    visible_when: field.visible_when,
    validation,
  };

  switch (field.type) {
    case 'email':
      return {
        ...base,
        type: field.type,
        ...(field.block_free_email !== undefined && {
          block_free_email: field.block_free_email,
        }),
        ...(field.otp !== undefined && {
          otp: field.otp,
        }),
      };

    case 'dropdown': {
      const options = field.options?.map((o) => compileOption(o, locale, data));
      return {
        ...base,
        type: field.type,
        ...(field.searchable !== undefined && {
          searchable: field.searchable,
        }),
        ...(options && { options }),
      };
    }

    case 'rating':
      return {
        ...base,
        type: field.type,
        ...(field.min_label && {
          min_label: interpolateTemplate(
            resolveLocalizedText(field.min_label, locale),
            data,
          ),
        }),
        ...(field.max_label && {
          max_label: interpolateTemplate(
            resolveLocalizedText(field.max_label, locale),
            data,
          ),
        }),
      };

    case 'address':
    case 'address_locality':
    case 'address_region':
    case 'address_country':
      return {
        ...base,
        type: field.type,
        ...(field.outputFormat !== undefined && {
          outputFormat: field.outputFormat,
        }),
      };

    case 'single_select':
    case 'multiple_select': {
      const options = field.options?.map((o) => compileOption(o, locale, data));
      return {
        ...base,
        type: field.type,
        ...(options && { options }),
        ...(field.allow_other !== undefined && {
          allow_other: field.allow_other,
        }),
      };
    }

    case 'camera':
      return {
        ...base,
        type: field.type,
        ...(field.facing_mode !== undefined && {
          facing_mode: field.facing_mode,
        }),
      };

    case 'geolocation':
      return { ...base, type: field.type };

    case 'file_upload':
      return {
        ...base,
        type: field.type,
        ...(field.accepted_mime_types !== undefined && {
          accepted_mime_types: field.accepted_mime_types,
        }),
      };

    default:
      return { ...base, type: field.type };
  }
}

export function resolveFieldVisibility(
  field: CompiledField,
  data: Record<string, unknown>,
): CompiledField {
  if (!field.visible_when) {
    return field;
  }

  const visible = evaluateExpression(field.visible_when, data);
  if (visible === field.visible) {
    return field;
  }

  return { ...field, visible };
}
