import type { CreateSessionInput, CreateSessionResult } from './types';

export async function createPaystackSession(
  input: CreateSessionInput,
): Promise<CreateSessionResult> {
  const response = await fetch(
    'https://api.paystack.co/transaction/initialize',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency.toUpperCase(),
        callback_url: input.returnUrl,
        metadata: input.metadata ?? {},
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Paystack session creation failed: ${errorBody}`);
  }

  const result = (await response.json()) as {
    data: {
      reference: string;
      authorization_url: string;
    };
  };

  return {
    providerSessionId: result.data.reference,
    redirectUrl: result.data.authorization_url,
  };
}

export function parsePaystackWebhookEvent(
  payload: string,
): { providerSessionId: string; status: 'succeeded' | 'failed' } | null {
  try {
    const event = JSON.parse(payload) as {
      event: string;
      data: {
        reference: string;
        status: string;
      };
    };

    if (event.event === 'charge.success' && event.data.status === 'success') {
      return {
        providerSessionId: event.data.reference,
        status: 'succeeded',
      };
    }

    if (event.event === 'charge.failed') {
      return {
        providerSessionId: event.data.reference,
        status: 'failed',
      };
    }

    return null;
  } catch {
    return null;
  }
}
