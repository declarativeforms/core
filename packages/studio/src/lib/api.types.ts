export type ApiOrganizationRole = 'admin' | 'member';

export type ApiOrganizationMember = {
  email: string;
  role: ApiOrganizationRole;
};

export type ApiOrganization = {
  id: string;
  name: string;
  slug: string;
  members: Array<ApiOrganizationMember>;
  can_use_email_connection: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
};

export type ApiSession = {
  email: string;
  organizations: Array<ApiOrganization>;
  provider: string;
};

export type ApiAccessToken = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export type ApiRuntimeConfig = {
  form_base_url: string;
};

export type ApiFormSummary = {
  branches: Array<string>;
  form_id: string;
  name: string;
  organization_id: string;
  revision: number;
  title: unknown;
  updated_at: string;
};

export type ApiBranchWrite = {
  branch: string;
  id: string;
  revision: number;
};

export type ApiBranchYaml = {
  revision: number;
  yaml: string;
};

export type ApiMessageRole = 'assistant' | 'system' | 'user';

export type ApiMessageStatus = 'complete' | 'failed' | 'pending';

export type ApiMessage = {
  id: string;
  organization_id: string;
  form_id: string;
  branch: string;
  sequence: number;
  role: ApiMessageRole;
  content: string;
  status: ApiMessageStatus;
  created_at: string;
  created_by: string;
  schema_revision: number | null;
  origin_branch: string | null;
  origin_message_id: string | null;
  generation_id: string | null;
};

export type ApiMessagePage = {
  messages: Array<ApiMessage>;
  next_cursor: string | null;
};

export type ApiMessageTurn = {
  assistant_message: ApiMessage;
  branch: string;
  definition: Record<string, unknown>;
  revision: number;
  summary: ApiFormSummary;
  user_message: ApiMessage;
};
