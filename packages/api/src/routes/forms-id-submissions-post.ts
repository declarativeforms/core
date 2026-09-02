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
      Body: Record<string, any>;
      Params: { id: string };
      Querystring: { id?: string; partial?: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { submissionService } = await getContainer();

    const submissionId =
      typeof request.query.id === 'string' ? request.query.id : undefined;

    const submission = await submissionService.createOrUpdate(
      request.params.id,
      request.body,
      request.query.partial === 'true',
      {
        ipAddress: String(request.headers['do-connecting-ip'] || ''),
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
