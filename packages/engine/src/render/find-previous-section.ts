import type { ICompiledForm } from '../types';

export function findPreviousSectionId(
  compiled: ICompiledForm,
  activeSectionId: string,
): string | undefined {
  const seen = new Set<string>();
  let currentId: string | undefined = compiled.sections[0]?.id;
  let previousId: string | undefined;

  while (currentId !== undefined && currentId !== activeSectionId) {
    if (seen.has(currentId)) {
      return undefined;
    }
    seen.add(currentId);

    const next = compiled.sections.find(
      (section) => section.id === currentId,
    )?.next;
    previousId = currentId;
    currentId =
      next && next !== 'done' && !next.startsWith('https://')
        ? next
        : undefined;
  }

  return currentId === activeSectionId ? previousId : undefined;
}
