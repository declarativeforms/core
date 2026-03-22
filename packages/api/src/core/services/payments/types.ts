export const PAYMENT_PROVIDERS = ['stripe', 'paystack', 'payfast'] as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export function isPaymentProvider(value: string): value is PaymentProvider {
  return (PAYMENT_PROVIDERS as readonly string[]).includes(value);
}

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
