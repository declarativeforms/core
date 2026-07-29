export type IEmailVerification = {
  attempts: number;
  created_at: string;
  email: string;
  expires_at: Date | string;
  field_id: string;
  form_id: string;
  hash: string;
  id: string;
  salt: string;
};
