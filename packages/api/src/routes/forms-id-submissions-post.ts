import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const FORMS_ID_SUBMISSIONS_POST: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 60,
      timeWindow: '1 minute',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Body: Record<string, unknown>;
      Params: { id: string };
      Querystring: { id?: string; partial: boolean };
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (Buffer.isBuffer(request.body)) {
      reply.status(400).send();

      return;
    }

    const { submissionService } = await getContainer();

    const submission = await submissionService.submit(
      request.params.id,
      request.body,
      request.query.partial,
      {
        ipAddress: request.ip,
        userAgent: String(request.headers['user-agent'] || ''),
      },
      request.query.id,
    );

    if (!submission) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send(submission);
  },
  method: 'POST',
  schema: {
    body: { type: 'object' },
    querystring: {
      properties: {
        id: { minLength: 1, type: 'string' },
        partial: { default: false, type: 'boolean' },
      },
      type: 'object',
    },
  },
  url: '/api/v1/forms/:id/submissions',
};
