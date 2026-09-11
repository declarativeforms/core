export type IFormMessageRole = 'assistant' | 'system' | 'user';

export type IFormMessage = {
  id: string;
  organization_id: string;
  form_id: string;
  branch: string;
  sequence: number;
  role: IFormMessageRole;
  content: string;
  created_at: Date;
};
