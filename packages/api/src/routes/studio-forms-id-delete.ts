import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const STUDIO_FORMS_ID_DELETE: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { studioFormService } = await getContainer();
    const didDelete = await studioFormService.delete(request.params.id);

    if (!didDelete) {
      reply.status(404).send();
      return;
    }

    reply.status(204).send();
  },
  method: 'DELETE',
  url: '/api/v1/studio/forms/:id',
};
