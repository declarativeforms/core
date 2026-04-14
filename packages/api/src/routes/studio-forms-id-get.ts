import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const STUDIO_FORMS_ID_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { formService } = await getContainer();
    const form = await formService.findById(request.params.id);

    if (!form) {
      reply.status(404).send();
      return;
    }

    reply.status(200).send(form);
  },
  method: 'GET',
  url: '/api/v1/studio/forms/:id',
};
