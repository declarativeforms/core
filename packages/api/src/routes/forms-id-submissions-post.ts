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

    const result = await submissionService.createOrUpdate(
      request.params.id,
      request.body,
      request.query.partial === 'true',
      {
        ipAddress: String(request.headers['do-connecting-ip'] || ''),
        userAgent: String(request.headers['user-agent'] || ''),
      },
      request.query.id,
    );

    if (!result) {
      reply.status(422).send();

      return;
    }

    if (result.type === 'invalid') {
      reply.status(422).send({ errors: result.errors });

      return;
    }

    reply.status(200).send(result.submission);
  },
  method: 'POST',
  url: '/api/v1/forms/:id/submissions',
};
