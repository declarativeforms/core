import type { IRenderableNavigation } from '../types';

export function renderNavigation(
  next: string | undefined,
): IRenderableNavigation {
  if (!next || next === 'done') {
    return { type: 'complete' };
  }

  if (next.startsWith('https://')) {
    return { type: 'redirect', url: next };
  }

  return { type: 'section', sectionId: next };
}
