import type { IDeclarativeForm } from '@declarativeforms/types';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { updateStudioFormById } from '../core';

export const STUDIO_FORMS_ID_PUT: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: IDeclarativeForm;
    }>,
    reply: FastifyReply,
  ) => {
    const form = await updateStudioFormById(request.params.id, request.body);

    if (!form) {
      reply.status(404).send();
      return;
    }

    reply.status(200).send(form);
  },
  method: 'PUT',
  url: '/api/v1/studio/forms/:id',
  schema: {
    tags: ['studio'],
    summary: 'Update a studio form',
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
    },
    body: {
      type: 'object',
      additionalProperties: true,
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
