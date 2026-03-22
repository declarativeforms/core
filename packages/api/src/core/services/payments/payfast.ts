import * as crypto from 'node:crypto';
import type { CreateSessionInput, CreateSessionResult } from './types';

export async function createPayfastSession(
  input: CreateSessionInput,
): Promise<CreateSessionResult> {
  // Payfast uses a form-post redirect model.
  // The merchant_id and merchant_key are stored as JSON in the connection secret.
  let merchantId: string;
  let merchantKey: string;
  let passphrase: string;

  try {
    const parsed = JSON.parse(input.secretKey) as {
      merchant_id: string;
      merchant_key: string;
      passphrase?: string;
    };
    merchantId = parsed.merchant_id;
    merchantKey = parsed.merchant_key;
    passphrase = parsed.passphrase ?? '';
  } catch {
    throw new Error(
      'Payfast connection secret must be a JSON object with merchant_id, merchant_key, and optional passphrase.',
    );
  }

  const paymentId =
    input.metadata?.payment_id ??
    crypto.randomBytes(8).toString('hex');

  // Payfast expects the amount in rands (currency units), not in cents
  // unlike Stripe and Paystack which use the smallest currency unit.
  const amountInRands = (input.amount / 100).toFixed(2);

  const params: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: input.returnUrl,
    cancel_url: input.cancelUrl,
    amount: amountInRands,
    item_name: input.description || 'Payment',
    m_payment_id: paymentId,
  };

  // Generate signature
  const signatureString =
    Object.entries(params)
      .map(([key, val]) => `${key}=${encodeURIComponent(val.trim())}`)
      .join('&') + (passphrase ? `&passphrase=${encodeURIComponent(passphrase.trim())}` : '');

  const signature = crypto
    .createHash('md5')
    .update(signatureString)
    .digest('hex');

  params.signature = signature;

  // Payfast sandbox merchant IDs start with '1000'
  const isSandbox = merchantId.startsWith('1000');
  const baseUrl = isSandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';

  const redirectUrl = `${baseUrl}?${new URLSearchParams(params).toString()}`;

  return {
    providerSessionId: paymentId,
    redirectUrl,
  };
}

export function parsePayfastWebhookEvent(
  payload: string,
): { providerSessionId: string; status: 'succeeded' | 'failed' } | null {
  try {
    const params = new URLSearchParams(payload);
    const paymentStatus = params.get('payment_status');
    const mPaymentId = params.get('m_payment_id');

    if (!mPaymentId) {
      return null;
    }

    if (paymentStatus === 'COMPLETE') {
      return {
        providerSessionId: mPaymentId,
        status: 'succeeded',
      };
    }

    if (paymentStatus === 'CANCELLED' || paymentStatus === 'FAILED') {
      return {
        providerSessionId: mPaymentId,
        status: 'failed',
      };
    }

    return null;
  } catch {
    return null;
  }
}
