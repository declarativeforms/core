import type { IDeclarativeForm } from '@declarativeforms/engine';

export const INTERNAL_FORM_METADATA_KEYS = [
  'branch',
  'created_at',
  'created_by',
  'deleted_at',
  'form_id',
  'name',
  'organization_id',
  'revision',
  'updated_at',
  'updated_by',
] as const;

export type IInternalForm = IDeclarativeForm & {
  branch: string;
  created_at: Date;
  created_by: string;
  deleted_at: Date | null;
  form_id: string;
  name: string | null;
  organization_id: string;
  revision: number;
  updated_at: Date;
  updated_by: string;
};
