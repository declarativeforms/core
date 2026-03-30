import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { findStudioFormById } from '../core';

export const STUDIO_FORMS_ID_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const form = await findStudioFormById(request.params.id);

    if (!form) {
      reply.status(404).send();
      return;
    }

    reply.status(200).send(form);
  },
  method: 'GET',
  url: '/api/v1/studio/forms/:id',
  schema: {
    tags: ['studio'],
    summary: 'Get a studio form by ID',
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
    },
    response: {
      200: {
        type: 'object',
        additionalProperties: true,
      },
      404: { type: 'null' },
    },
  },
};
