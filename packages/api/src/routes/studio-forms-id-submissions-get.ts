import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const STUDIO_FORMS_ID_SUBMISSIONS_GET: RouteOptions<any, any, any, any> =
  {
    handler: async (
      request: FastifyRequest<{
        Params: { id: string };
      }>,
      reply: FastifyReply,
    ) => {
      const { submissionService } = await getContainer();

      const submissions = await submissionService.list(request.params.id);

      if (!submissions) {
        reply.status(404).send();

        return;
      }

      reply.status(200).send(submissions);
    },
    method: 'GET',
    url: '/api/v1/studio/forms/:id/submissions',
  };
