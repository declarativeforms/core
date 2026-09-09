import type { ICompiledFormField, ICompiledFormSection } from '../types';

function emptyValueForFieldType(field: ICompiledFormField): unknown {
  switch (field.type) {
    case 'file_upload':
    case 'multiple_select':
      return [];
    case 'camera':
    case 'geolocation':
    case 'signature':
      return null;
    default:
      return '';
  }
}

export function buildDefaultValues(
  section: ICompiledFormSection,
  data: Record<string, unknown>,
): Record<string, unknown> {
  return section.fields.reduce<Record<string, unknown>>((acc, field) => {
    acc[field.id] =
      data[field.id] !== undefined
        ? data[field.id]
        : emptyValueForFieldType(field);
    return acc;
  }, {});
}
