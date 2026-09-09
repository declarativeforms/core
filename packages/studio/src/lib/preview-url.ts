export const DEFAULT_BRANCH = 'main';

export function isDraftBranch(branch: string): boolean {
  return branch !== DEFAULT_BRANCH;
}

export function buildFormUrl(
  formBaseUrl: string,
  formId: string,
  branch: string,
): string {
  const base = `${formBaseUrl.replace(/\/+$/, '')}/${encodeURIComponent(formId)}`;

  if (!isDraftBranch(branch)) {
    return base;
  }

  const query = new URLSearchParams();
  query.set('branch', branch);

  return `${base}?${query.toString()}`;
}
