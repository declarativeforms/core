export type IPaymentRecord = {
  id: string;
  form_id: string;
  submission_id: string;
  field_id: string;
  connection_id: string;
  provider: string;
  provider_session_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
};
