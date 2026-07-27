import type { IDeclarativeForm } from '@declarativeforms/core';

export type ManagedForm = IDeclarativeForm & {
  id: string;
  created_at: string;
  updated_at: string;
};
