import type { IDeclarativeFormField, IResolvedFormField } from '../types';
import { isDeclarativeFieldType } from '../types';
import { resolveLocalizedText } from './localize';
import { resolveFormOption } from './resolve-form-option';
import { resolveFormValidator } from './resolve-form-validator';

export function resolveFormField(
  field: IDeclarativeFormField,
  locale: string,
): IResolvedFormField | null {
  if (!isDeclarativeFieldType(field.type)) {
    return null;
  }

  const base = {
    ...(field.id !== undefined && { id: field.id }),
    ...(field.label !== undefined && {
      label: resolveLocalizedText(field.label, locale),
    }),
    ...(field.placeholder !== undefined && {
      placeholder: resolveLocalizedText(field.placeholder, locale),
    }),
    ...(field.validators !== undefined && {
      validators: field.validators.map((v) => resolveFormValidator(v, locale)),
    }),
    ...(field.visible_when !== undefined && {
      visible_when: field.visible_when,
    }),
  };

  switch (field.type) {
    case 'email':
      return { ...base, type: 'email' };
    case 'dropdown':
      return {
        ...base,
        type: 'dropdown',
        ...(field.searchable !== undefined && { searchable: field.searchable }),
        ...(field.options !== undefined && {
          options: field.options.map((o) => resolveFormOption(o, locale)),
        }),
      };
    case 'rating':
      return {
        ...base,
        type: 'rating',
        ...(field.min_label !== undefined && {
          min_label: resolveLocalizedText(field.min_label, locale),
        }),
        ...(field.max_label !== undefined && {
          max_label: resolveLocalizedText(field.max_label, locale),
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
    case 'multiple_select':
      return {
        ...base,
        type: field.type,
        ...(field.options !== undefined && {
          options: field.options.map((o) => resolveFormOption(o, locale)),
        }),
        ...(field.allow_other !== undefined && {
          allow_other: field.allow_other,
        }),
      };
    case 'camera':
      return {
        ...base,
        type: 'camera',
        ...(field.facing_mode !== undefined && {
          facing_mode: field.facing_mode,
        }),
      };
    case 'geolocation':
      return { ...base, type: 'geolocation' };
    case 'file_upload':
      return {
        ...base,
        type: 'file_upload',
        ...(field.accepted_mime_types !== undefined && {
          accepted_mime_types: field.accepted_mime_types,
        }),
      };
    default:
      return { ...base, type: field.type };
  }
}
