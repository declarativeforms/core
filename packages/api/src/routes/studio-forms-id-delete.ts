import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { deleteStudioFormById } from '../core';

export const STUDIO_FORMS_ID_DELETE: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const didDelete = await deleteStudioFormById(request.params.id);

    if (!didDelete) {
      reply.status(404).send();
      return;
    }

    reply.status(204).send();
  },
  method: 'DELETE',
  url: '/api/v1/studio/forms/:id',
  schema: {
    tags: ['studio'],
    summary: 'Delete a studio form',
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
    },
    response: {
      204: { type: 'null' },
      404: { type: 'null' },
    },
  },
};
