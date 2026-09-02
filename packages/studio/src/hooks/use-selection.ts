import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { DEFAULT_BRANCH } from '@/lib/preview-url';
import {
  readPersistedSelection,
  writePersistedSelection,
} from '@/lib/selection-store';

export type Selection = {
  organizationId: string | null;
  formId: string | null;
  branch: string;
  selectOrganization: (organizationId: string) => void;
  selectForm: (formId: string, branch: string) => void;
  selectBranch: (branch: string) => void;
  clearForm: () => void;
};

export function useSelection(organizationId: string | null): Selection {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const formId = params.formId ?? null;
  const branch = searchParams.get('branch') ?? DEFAULT_BRANCH;

  useEffect(() => {
    writePersistedSelection({ branch, formId, organizationId });
  }, [branch, formId, organizationId]);

  const goToForm = (nextForm: string, nextBranch: string): void => {
    const search =
      nextBranch === DEFAULT_BRANCH
        ? ''
        : `?branch=${encodeURIComponent(nextBranch)}`;
    void navigate(`/forms/${encodeURIComponent(nextForm)}${search}`);
  };

  return {
    branch,
    clearForm: () => {
      void navigate('/');
    },
    formId,
    organizationId,
    selectBranch: (next: string) => {
      if (!formId) {
        return;
      }

      goToForm(formId, next);
    },
    selectForm: goToForm,
    selectOrganization: (next: string) => {
      writePersistedSelection({
        branch: DEFAULT_BRANCH,
        formId: null,
        organizationId: next,
      });
      void navigate('/');
    },
  };
}

export function restoreSelectionPath(): string | null {
  const persisted = readPersistedSelection();

  if (!persisted.formId) {
    return null;
  }

  const search =
    persisted.branch === DEFAULT_BRANCH
      ? ''
      : `?branch=${encodeURIComponent(persisted.branch)}`;

  return `/forms/${encodeURIComponent(persisted.formId)}${search}`;
}
