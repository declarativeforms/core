const DRAFT_PREFIX = 'declarativeforms.studio.draft.';

export function readDraft(organizationId: string): string {
  try {
    return (
      window.localStorage.getItem(`${DRAFT_PREFIX}${organizationId}`) ?? ''
    );
  } catch {
    return '';
  }
}

export function writeDraft(organizationId: string, value: string): void {
  try {
    if (!value) {
      window.localStorage.removeItem(`${DRAFT_PREFIX}${organizationId}`);

      return;
    }

    window.localStorage.setItem(`${DRAFT_PREFIX}${organizationId}`, value);
  } catch {
    return;
  }
}

export function clearDrafts(): void {
  try {
    const doomed: Array<string> = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (key && key.startsWith(DRAFT_PREFIX)) {
        doomed.push(key);
      }
    }

    for (const key of doomed) {
      window.localStorage.removeItem(key);
    }
  } catch {
    return;
  }
}
