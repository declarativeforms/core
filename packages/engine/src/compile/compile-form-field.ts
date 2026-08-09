import type { ICompiledFormField, IResolvedFormField } from '../types';
import { buildValidationRules } from './compile-form-validator';
import { compileFormOption } from './compile-form-option';
import { evaluateExpression } from './expression';
import { DEFAULT_MESSAGES, type ValidationMessages } from './messages';
import { interpolateTemplate } from './template';

/**
 * Apply the answers to a resolved field: interpolate label/placeholder, assess
 * `visible_when` into `visible`, normalize validators + `required`, and
 * concretize options.
 */
export function compileFormField(
  field: IResolvedFormField,
  data: Record<string, unknown>,
  messages: ValidationMessages = DEFAULT_MESSAGES,
): ICompiledFormField {
  const label =
    field.label !== undefined ? interpolateTemplate(field.label, data) : '';
  const validation = buildValidationRules(
    field.type,
    field.validators ?? [],
    label,
    messages,
  );

  const base = {
    id: field.id ?? '',
    label,
    ...(field.placeholder !== undefined && {
      placeholder: interpolateTemplate(field.placeholder, data),
    }),
    required: validation.some((rule) => rule.type === 'required'),
    visible: field.visible_when
      ? evaluateExpression(field.visible_when, data)
      : true,
    ...(field.visible_when !== undefined && {
      visible_when: field.visible_when,
    }),
    validation,
  };

  switch (field.type) {
    case 'email':
      return { ...base, type: 'email' };
    case 'dropdown':
      return {
        ...base,
        type: 'dropdown',
        ...(field.searchable !== undefined && { searchable: field.searchable }),
        options: (field.options ?? []).map((o) => compileFormOption(o, data)),
      };
    case 'rating':
      return {
        ...base,
        type: 'rating',
        ...(field.min_label !== undefined && {
          min_label: interpolateTemplate(field.min_label, data),
        }),
        ...(field.max_label !== undefined && {
          max_label: interpolateTemplate(field.max_label, data),
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
        options: (field.options ?? []).map((o) => compileFormOption(o, data)),
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
