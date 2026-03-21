import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { findSubmissionById } from '../core';

export const FORMS_ID_SUBMISSIONS_ID_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string; submissionId: string };
    }>,
    reply: FastifyReply,
  ) => {
    const submission = await findSubmissionById(
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
  schema: {
    tags: ['forms'],
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        submissionId: { type: 'string' },
      },
      required: ['id', 'submissionId'],
    },
  },
};
