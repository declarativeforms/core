export type ISubmission = {
  created_at: string;
  data: Record<string, unknown>;
  form_id: string;
  id: string;
  metadata: {
    ip_address: string;
    user_agent: string;
  };
  deliveries?: Array<{
    attempts: number;
    connection_index: number;
    error?: string;
    status: 'delivered' | 'failed';
    type: string;
    updated_at: string;
  }>;
  status: 'partial' | 'completed';
  updated_at: string;
};
