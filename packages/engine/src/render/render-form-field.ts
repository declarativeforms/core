import type { ICompiledFormField, IRenderableField } from '../types';
import {
  findValidationRule,
  getCharLimit,
  getNumericBound,
  getRatingRange,
} from './field-metadata';

export function renderFormField(field: ICompiledFormField): IRenderableField {
  const base = {
    id: field.id,
    label: field.label,
    ...(field.placeholder !== undefined && { placeholder: field.placeholder }),
    required: field.required,
    visible: field.visible,
    ...(field.visible_when !== undefined && {
      visibleWhen: field.visible_when,
    }),
    validation: field.validation,
  };

  switch (field.type) {
    case 'short_text':
    case 'url':
    case 'mobile_number': {
      const min = getCharLimit(field.validation, 'min_length');
      const max = getCharLimit(field.validation, 'max_length');
      const inputType =
        field.type === 'url'
          ? 'url'
          : field.type === 'mobile_number'
            ? 'tel'
            : 'text';
      return {
        ...base,
        type: field.type,
        inputType,
        ...(min !== undefined && { min }),
        ...(max !== undefined && { max }),
      };
    }
    case 'number': {
      const min = getNumericBound(field.validation, 'min');
      const max = getNumericBound(field.validation, 'max');
      const integer = field.validation.some(
        (rule) => rule.type === 'pattern' && rule.regex === '^\\d+$',
      );
      return {
        ...base,
        type: 'number',
        integer,
        ...(min !== undefined && { min }),
        ...(max !== undefined && { max }),
      };
    }
    case 'date':
    case 'date_month':
    case 'time': {
      const minRule = findValidationRule(field.validation, 'min');
      const maxRule = findValidationRule(field.validation, 'max');
      const inputType =
        field.type === 'date'
          ? 'date'
          : field.type === 'date_month'
            ? 'month'
            : 'time';
      return {
        ...base,
        type: field.type,
        inputType,
        ...(minRule && { min: String(minRule.value) }),
        ...(maxRule && { max: String(maxRule.value) }),
      };
    }
    case 'long_text': {
      const min = getCharLimit(field.validation, 'min_length');
      const max = getCharLimit(field.validation, 'max_length');
      return {
        ...base,
        type: 'long_text',
        ...(min !== undefined && { min }),
        ...(max !== undefined && { max }),
      };
    }
    case 'email': {
      const min = getCharLimit(field.validation, 'min_length');
      const max = getCharLimit(field.validation, 'max_length');
      return {
        ...base,
        type: 'email',
        otp: field.otp === true,
        ...(min !== undefined && { min }),
        ...(max !== undefined && { max }),
      };
    }
    case 'dropdown':
      return {
        ...base,
        type: 'dropdown',
        options: field.options ?? [],
        searchable: field.searchable === true,
      };
    case 'single_select':
      return {
        ...base,
        type: 'single_select',
        options: field.options ?? [],
        allowOther: field.allow_other === true,
      };
    case 'multiple_select': {
      const min = getNumericBound(field.validation, 'min');
      const max = getNumericBound(field.validation, 'max');
      return {
        ...base,
        type: 'multiple_select',
        options: field.options ?? [],
        allowOther: field.allow_other === true,
        ...(min !== undefined && { min }),
        ...(max !== undefined && { max }),
      };
    }
    case 'rating': {
      const range = getRatingRange(field.validation);
      return {
        ...base,
        type: 'rating',
        min: range.min,
        max: range.max,
        ...(field.min_label !== undefined && { minLabel: field.min_label }),
        ...(field.max_label !== undefined && { maxLabel: field.max_label }),
      };
    }
    case 'address':
    case 'address_locality':
    case 'address_region':
    case 'address_country':
      return {
        ...base,
        type: field.type,
        outputFormat: field.outputFormat ?? 'string',
      };
    case 'file_upload': {
      const min = getNumericBound(field.validation, 'min');
      const max = getNumericBound(field.validation, 'max');
      return {
        ...base,
        type: 'file_upload',
        acceptedMimeTypes: field.accepted_mime_types ?? [],
        storesScalar: (max ?? 1) === 1,
        ...(min !== undefined && { min }),
        ...(max !== undefined && { max }),
      };
    }
    case 'signature':
      return { ...base, type: 'signature' };
    case 'camera':
      return {
        ...base,
        type: 'camera',
        facingMode: field.facing_mode ?? 'rear',
      };
    case 'geolocation':
      return { ...base, type: 'geolocation' };
    default:
      return { ...base, type: 'hidden' };
  }
}
