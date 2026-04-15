import type { CompiledSection } from '../types';

function getDefaultValueForFieldType(
  field: CompiledSection['fields'][number],
): unknown {
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
  section: CompiledSection,
  data: Record<string, unknown>,
): Record<string, unknown> {
  return section.fields.reduce<Record<string, unknown>>((acc, field) => {
    const fieldValue = data[field.id];

    acc[field.id] =
      fieldValue !== undefined
        ? fieldValue
        : getDefaultValueForFieldType(field);

    return acc;
  }, {});
}
