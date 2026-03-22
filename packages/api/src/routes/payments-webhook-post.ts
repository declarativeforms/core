import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { handlePaymentWebhook } from '../core/services/payments';

const PAYMENT_PROVIDERS = ['stripe', 'paystack', 'payfast'] as const;
type PaymentProviderParam = (typeof PAYMENT_PROVIDERS)[number];

function isPaymentProvider(value: string): value is PaymentProviderParam {
  return (PAYMENT_PROVIDERS as readonly string[]).includes(value);
}

export const PAYMENTS_WEBHOOK_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { provider: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { provider } = request.params;

    if (!isPaymentProvider(provider)) {
      return reply.status(400).send({ error: 'Unsupported provider.' });
    }

    // The raw body is available as a Buffer due to the custom content-type parser
    const payload =
      typeof request.body === 'string'
        ? request.body
        : Buffer.isBuffer(request.body)
          ? (request.body as Buffer).toString('utf-8')
          : JSON.stringify(request.body);

    try {
      await handlePaymentWebhook(
        provider,
        payload,
      );

      reply.status(200).send({ received: true });
    } catch (error) {
      request.log.error(error, 'Payment webhook processing failed');
      reply.status(500).send({ error: 'Webhook processing failed.' });
    }
  },
  method: 'POST',
  url: '/api/v1/payments/webhook/:provider',
  schema: {
    tags: ['payments'],
    params: {
      type: 'object',
      required: ['provider'],
      properties: {
        provider: { type: 'string' },
      },
    },
  },
};
