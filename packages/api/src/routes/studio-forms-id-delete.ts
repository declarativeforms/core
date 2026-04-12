import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { deleteStudioFormById, findUserByToken, parseAuthorizationHeader } from '../core';

export const STUDIO_FORMS_ID_DELETE: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const token = parseAuthorizationHeader(request.headers.authorization);
    const user = token ? await findUserByToken(token) : null;

    await deleteStudioFormById(request.params.id, user?.email ?? null);

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
    },
  },
};
