export type IEmailVerificationRecord = {
  id: string;
  email: string;
  salt: string;
  hash: string;
  created_at: string;
  expires_at: string;
};
