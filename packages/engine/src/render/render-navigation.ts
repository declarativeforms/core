import type { IRenderableNavigation } from '../types';

/**
 * Map a compiled section's resolved `next` target to a navigation outcome:
 * `'done'` (or missing) → complete, an `https://` target → redirect, otherwise
 * advance to that section.
 */
export function renderNavigation(next: string | undefined): IRenderableNavigation {
  if (!next || next === 'done') {
    return { type: 'complete' };
  }
  if (next.startsWith('https://')) {
    return { type: 'redirect', url: next };
  }
  return { type: 'section', sectionId: next };
}
