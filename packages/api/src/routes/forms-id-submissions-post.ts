import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const FORMS_ID_SUBMISSIONS_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: Record<string, any>;
      Params: { id: string };
      Querystring: { id?: string; partial?: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { submissionService } = await getContainer();
    const submission = await submissionService.createOrUpdate({
      data: request.body,
      formId: request.params.id,
      isPartial: request.query.partial === 'true',
      metadata: {
        ipAddress: String(request.headers['do-connecting-ip'] || ''),
        userAgent: String(request.headers['user-agent'] || ''),
      },
      submissionId: request.query.id,
    });

    if (!submission) {
      reply.status(422).send();
      return;
    }

    reply.status(200).send(submission);
  },
  method: 'POST',
  url: '/api/v1/forms/:id/submissions',
};
