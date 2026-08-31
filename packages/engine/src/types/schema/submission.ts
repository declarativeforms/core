export type ISubmission = {
  created_at: string;
  data: Record<string, unknown>;
  form_id: string;
  id: string;
  metadata: {
    ip_address: string;
    user_agent: string;
  };
  status: 'partial' | 'completed';
  updated_at: string;
};
