export type IFormMessageRole = 'assistant' | 'system' | 'user';

export type IFormMessageStatus = 'complete' | 'failed' | 'pending';

export type IFormMessage = {
  id: string;
  organization_id: string;
  form_id: string;
  branch: string;
  sequence: number;
  role: IFormMessageRole;
  content: string;
  status: IFormMessageStatus;
  created_at: Date;
  created_by: string;
  schema_revision: number | null;
  origin_branch: string | null;
  origin_message_id: string | null;
  generation_id: string | null;
};
