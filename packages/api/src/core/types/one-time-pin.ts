export type IOneTimePinRecord = {
  id: string;
  field_id: string;
  email: string;
  one_time_pin_hash: string;
  created_at: string;
  expires_at: string;
  consumed: boolean;
  verify_attempts: number;
};

export type IVerificationTokenPayload = {
  field_id: string;
  email: string;
  request_id: string;
  exp: number;
};
