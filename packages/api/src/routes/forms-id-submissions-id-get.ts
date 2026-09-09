import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const FORMS_ID_SUBMISSIONS_ID_GET: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 30,
      timeWindow: '1 minute',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Params: { id: string; submissionId: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { submissionService } = await getContainer();

    const submission = await submissionService.findById(
      request.params.id,
      request.params.submissionId,
    );

    if (!submission) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send(submission);
  },
  method: 'GET',
  url: '/api/v1/forms/:id/submissions/:submissionId',
};
