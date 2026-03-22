import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getPaymentStatus } from '../core/services/payments';

export const PAYMENTS_ID_STATUS_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const paymentId = request.params.id;

    if (!paymentId) {
      return reply.status(400).send({ error: 'Payment ID is required.' });
    }

    const result = await getPaymentStatus(paymentId);

    if (!result) {
      return reply.status(404).send({ error: 'Payment not found.' });
    }

    reply.status(200).send(result);
  },
  method: 'GET',
  url: '/api/v1/payments/:id/status',
  schema: {
    tags: ['payments'],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
      },
    },
  },
};
