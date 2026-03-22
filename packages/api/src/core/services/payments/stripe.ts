import type { CreateSessionInput, CreateSessionResult } from './types';

export async function createStripeSession(
  input: CreateSessionInput,
): Promise<CreateSessionResult> {
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'mode': 'payment',
      'success_url': input.returnUrl,
      'cancel_url': input.cancelUrl,
      'line_items[0][price_data][currency]': input.currency.toLowerCase(),
      'line_items[0][price_data][product_data][name]':
        input.description || 'Payment',
      'line_items[0][price_data][unit_amount]': String(input.amount),
      'line_items[0][quantity]': '1',
      ...(input.metadata
        ? Object.fromEntries(
            Object.entries(input.metadata).map(([k, v]) => [
              `metadata[${k}]`,
              v,
            ]),
          )
        : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Stripe session creation failed: ${errorBody}`);
  }

  const session = (await response.json()) as {
    id: string;
    url: string;
  };

  return {
    providerSessionId: session.id,
    redirectUrl: session.url,
  };
}

export function parseStripeWebhookEvent(
  payload: string,
): { providerSessionId: string; status: 'succeeded' | 'failed' } | null {
  try {
    const event = JSON.parse(payload) as {
      type: string;
      data: {
        object: {
          id: string;
          payment_status?: string;
          metadata?: Record<string, string>;
        };
      };
    };

    if (event.type === 'checkout.session.completed') {
      return {
        providerSessionId: event.data.object.id,
        status:
          event.data.object.payment_status === 'paid'
            ? 'succeeded'
            : 'failed',
      };
    }

    if (event.type === 'checkout.session.expired') {
      return {
        providerSessionId: event.data.object.id,
        status: 'failed',
      };
    }

    return null;
  } catch {
    return null;
  }
}
