export type PaymentProvider = 'stripe' | 'paystack' | 'payfast';

export type CreateSessionInput = {
  provider: PaymentProvider;
  secretKey: string;
  amount: number;
  currency: string;
  description?: string;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

export type CreateSessionResult = {
  providerSessionId: string;
  redirectUrl: string;
};

export type WebhookEvent = {
  providerSessionId: string;
  status: 'succeeded' | 'failed' | 'cancelled';
};

export type VerifyWebhookInput = {
  provider: PaymentProvider;
  secretKey: string;
  payload: string;
  signature: string;
};
