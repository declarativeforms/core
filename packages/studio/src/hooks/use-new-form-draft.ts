import { useState } from 'react';
import { readDraft, writeDraft } from '@/lib/draft-store';

export type NewFormDraft = {
  value: string;
  setValue: (value: string) => void;
  clear: () => void;
};

export function useNewFormDraft(organizationId: string): NewFormDraft {
  const [value, setStateValue] = useState(() => readDraft(organizationId));

  return {
    clear: () => {
      setStateValue('');
      writeDraft(organizationId, '');
    },
    setValue: (next: string) => {
      setStateValue(next);
      writeDraft(organizationId, next);
    },
    value,
  };
}
