import type { IResolvedFormSection } from '../types';
import { evaluateExpression } from './expression';

/**
 * Resolve a section's `next` against the answers to a concrete target: a
 * section id, the sentinel `'done'`, or an external URL. A literal string is
 * used directly; otherwise rules are evaluated in order (`else` is the
 * fallback), defaulting to `'done'` when nothing matches.
 */
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
