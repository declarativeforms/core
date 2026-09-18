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
      Querystring: { id?: string; partial?: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { submissionService } = await getContainer();

    if (
      !request.body ||
      typeof request.body !== 'object' ||
      Array.isArray(request.body) ||
      Buffer.isBuffer(request.body) ||
      (request.query.id !== undefined &&
        (typeof request.query.id !== 'string' || !request.query.id)) ||
      (request.query.partial !== undefined &&
        request.query.partial !== 'true' &&
        request.query.partial !== 'false')
    ) {
      reply.status(400).send();

      return;
    }

    const submissionId =
      typeof request.query.id === 'string' ? request.query.id : undefined;

    const submission = await submissionService.submit(
      request.params.id,
      request.body,
      request.query.partial === 'true',
      {
        ipAddress: request.ip,
        userAgent: String(request.headers['user-agent'] || ''),
      },
      submissionId,
    );

    if (!submission) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send(submission);
  },
  method: 'POST',
  url: '/api/v1/forms/:id/submissions',
};
