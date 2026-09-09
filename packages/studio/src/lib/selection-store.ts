const SELECTION_KEY = 'declarativeforms.studio.selection';

export type PersistedSelection = {
  organizationId: string | null;
  formId: string | null;
  branch: string;
};

export function readPersistedSelection(): PersistedSelection {
  try {
    const raw = window.localStorage.getItem(SELECTION_KEY);

    if (!raw) {
      return { branch: 'main', formId: null, organizationId: null };
    }

    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object') {
      return { branch: 'main', formId: null, organizationId: null };
    }

    const source = parsed as Record<string, unknown>;

    return {
      branch:
        typeof source.branch === 'string' && source.branch
          ? source.branch
          : 'main',
      formId: typeof source.formId === 'string' ? source.formId : null,
      organizationId:
        typeof source.organizationId === 'string'
          ? source.organizationId
          : null,
    };
  } catch {
    return { branch: 'main', formId: null, organizationId: null };
  }
}

export function writePersistedSelection(value: PersistedSelection): void {
  try {
    window.localStorage.setItem(SELECTION_KEY, JSON.stringify(value));
  } catch {
    return;
  }
}

export function clearPersistedSelection(): void {
  try {
    window.localStorage.removeItem(SELECTION_KEY);
  } catch {
    return;
  }
}
