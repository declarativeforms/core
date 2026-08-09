import type { ICompiledForm } from '../types';

/**
 * Resolve the section a Back action should return to. Navigation is deterministic
 * from the answers, so the path is replayed from the first section: follow each
 * section's compiled `next` until `activeSectionId` is reached; the section
 * visited just before it is the Back target. Returns `undefined` when the active
 * section is the entry point (or is unreachable), i.e. Back is not available.
 */
export function findPreviousSectionId(
  compiled: ICompiledForm,
  activeSectionId: string,
): string | undefined {
  const seen = new Set<string>();
  let currentId: string | undefined = compiled.sections[0]?.id;
  let previousId: string | undefined;

  while (currentId !== undefined && currentId !== activeSectionId) {
    // Guard against a cyclic `next` chain, which would otherwise loop forever.
    if (seen.has(currentId)) {
      return undefined;
    }
    seen.add(currentId);

    const next = compiled.sections.find(
      (section) => section.id === currentId,
    )?.next;
    previousId = currentId;
    currentId =
      next && next !== 'done' && !next.startsWith('https://') ? next : undefined;
  }

  return currentId === activeSectionId ? previousId : undefined;
}
