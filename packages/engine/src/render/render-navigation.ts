import type { IRenderableNavigation } from '../types';

export function renderNavigation(
  nextTarget: string | undefined,
): IRenderableNavigation {
  if (!nextTarget || nextTarget === 'done') {
    return { type: 'complete' };
  }

  if (nextTarget.startsWith('https://')) {
    return { type: 'redirect', url: nextTarget };
  }

  return { type: 'section', sectionId: nextTarget };
}
