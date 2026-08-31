import type { IResolvedFormSection } from '../types';
import { evaluateExpression } from './expression';

export function resolveNextSectionId(
  section: IResolvedFormSection,
  data: Record<string, unknown>,
): string {
  if (typeof section.next === 'string') {
    return section.next;
  }

  for (const rule of section.next ?? []) {
    if ('else' in rule) {
      if (rule.else) {
        return rule.else;
      }
      continue;
    }
    if (rule.when && rule.go && evaluateExpression(rule.when, data)) {
      return rule.go;
    }
  }

  return 'done';
}

export function isExternalNextSectionId(nextSectionId: string): boolean {
  return nextSectionId.startsWith('https://');
}
