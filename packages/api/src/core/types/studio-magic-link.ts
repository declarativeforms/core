export type IStudioMagicLinkRecord = {
  id: string;
  email: string;
  token_hash: string;
  created_at: string;
  expires_at: string;
  consumed: boolean;
};
