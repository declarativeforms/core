import {
  isDeclarativeFieldType,
  type FormDefinition,
} from './definition';

export function validateFormDefinition(
  definition: FormDefinition,
): string[] {
  const errors: string[] = [];
  const sections = definition.sections ?? [];

  if (sections.length === 0) {
    return ['sections must contain at least one section'];
  }

  const sectionIds = new Set<string>();
  const fieldIds = new Set<string>();

  for (const [sectionIndex, section] of sections.entries()) {
    const sectionPath = `sections[${sectionIndex}]`;
    if (!section.id) {
      errors.push(`${sectionPath}.id is required`);
    } else if (sectionIds.has(section.id)) {
      errors.push(`${sectionPath}.id must be unique`);
    } else {
      sectionIds.add(section.id);
    }

    for (const [fieldIndex, field] of (section.fields ?? []).entries()) {
      const fieldPath = `${sectionPath}.fields[${fieldIndex}]`;
      if (!field.id) {
        errors.push(`${fieldPath}.id is required`);
      } else if (fieldIds.has(field.id)) {
        errors.push(`${fieldPath}.id must be unique`);
      } else {
        fieldIds.add(field.id);
      }

      if (!isDeclarativeFieldType(field.type)) {
        errors.push(`${fieldPath}.type is not supported`);
      }
    }
  }

  for (const [sectionIndex, section] of sections.entries()) {
    const targets =
      typeof section.next === 'string'
        ? [section.next]
        : (section.next ?? []).flatMap((rule) => {
            if ('go' in rule && rule.go) return [rule.go];
            if ('else' in rule && rule.else) return [rule.else];
            return [];
          });

    for (const target of targets) {
      if (
        target !== 'done' &&
        !target.startsWith('https://') &&
        !sectionIds.has(target)
      ) {
        errors.push(
          `sections[${sectionIndex}].next references unknown section "${target}"`,
        );
      }
    }
  }

  return errors;
}
