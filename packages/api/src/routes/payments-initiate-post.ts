import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { initiatePayment } from '../core/services/payments';

export const PAYMENTS_INITIATE_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: {
        formId: string;
        submissionId: string;
        fieldId: string;
        connectionId: string;
        provider: string;
        amount: number;
        currency: string;
        description?: string;
        returnUrl: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const {
      formId,
      submissionId,
      fieldId,
      connectionId,
      provider,
      amount,
      currency,
      description,
      returnUrl,
    } = request.body;

    if (!formId || !fieldId || !connectionId || !provider || !amount || !currency || !returnUrl) {
      return reply.status(400).send({ error: 'Missing required fields.' });
    }

    const validProviders = ['stripe', 'paystack', 'payfast'];
    if (!validProviders.includes(provider)) {
      return reply.status(400).send({ error: 'Unsupported payment provider.' });
    }

    try {
      const result = await initiatePayment({
        formId,
        submissionId: submissionId || '',
        fieldId,
        connectionId,
        provider: provider as 'stripe' | 'paystack' | 'payfast',
        amount,
        currency,
        description,
        returnUrl,
      });

      reply.status(200).send(result);
    } catch (error) {
      request.log.error(error, 'Payment initiation failed');
      reply.status(500).send({ error: 'Payment initiation failed.' });
    }
  },
  method: 'POST',
  url: '/api/v1/payments/initiate',
  schema: {
    tags: ['payments'],
    body: {
      type: 'object',
      required: [
        'formId',
        'fieldId',
        'connectionId',
        'provider',
        'amount',
        'currency',
        'returnUrl',
      ],
      properties: {
        formId: { type: 'string' },
        submissionId: { type: 'string' },
        fieldId: { type: 'string' },
        connectionId: { type: 'string' },
        provider: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        description: { type: 'string' },
        returnUrl: { type: 'string' },
      },
    },
  },
};
