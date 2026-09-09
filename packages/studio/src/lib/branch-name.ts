import { DEFAULT_BRANCH } from '@/lib/preview-url';

const BRANCH_PATTERN = /^[a-z0-9][a-z0-9_-]{0,62}$/;

export const BRANCH_NAME_HINT =
  'Lowercase letters, numbers, hyphen and underscore. Up to 63 characters.';

export function validateBranchName(value: string): string | null {
  if (!value) {
    return 'Enter a branch name.';
  }

  if (value === DEFAULT_BRANCH) {
    return 'main cannot be used as a new branch name.';
  }

  if (!BRANCH_PATTERN.test(value)) {
    return BRANCH_NAME_HINT;
  }

  return null;
}
