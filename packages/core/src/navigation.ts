import type { IDeclarativeFormSection } from './definition';
import type { IDeclarativeForm } from './definition';
import { evaluateExpression } from './expression';

export function resolveNextSectionId(
  section: IDeclarativeFormSection,
  formData: Record<string, unknown>,
): string {
  if (typeof section.next === 'string') {
    return section.next;
  }

  let fallback = 'done';

  for (const rule of section.next ?? []) {
    if ('else' in rule && rule.else) {
      fallback = rule.else;
      continue;
    }

    if (
      'when' in rule &&
      rule.when &&
      rule.go &&
      evaluateExpression(rule.when, formData)
    ) {
      return rule.go;
    }
  }

  return fallback;
}

export function isExternalNextSectionId(nextSectionId: string): boolean {
  return nextSectionId.startsWith('https://');
}

export function buildSectionHistory(
  schema: IDeclarativeForm,
  data: Record<string, unknown>,
  activeSectionId: string,
): string[] {
  const sections = schema.sections ?? [];
  let section: IDeclarativeFormSection | undefined = sections[0];
  const history: string[] = [];
  const visited = new Set<string>();

  while (
    section?.id &&
    section.id !== activeSectionId &&
    !visited.has(section.id)
  ) {
    visited.add(section.id);
    const nextSectionId = resolveNextSectionId(section, data);
    if (nextSectionId === 'done' || isExternalNextSectionId(nextSectionId)) {
      return [];
    }
    history.push(section.id);
    section = sections.find((candidate) => candidate.id === nextSectionId);
  }

  return section?.id === activeSectionId ? history : [];
}
