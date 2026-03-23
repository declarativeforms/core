import { findFormById, IDeclarativeForm } from '../core';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';

export const FORMS_ID_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const form: IDeclarativeForm | null = await findFormById(
      request.params.id,
    );

    if (!form) {
      return reply.status(404).send();
    }

    reply.status(200).send(form);
  },
  method: 'GET',
  url: '/api/v1/forms/:id',
  schema: {
    tags: ['forms'],
    summary: 'Get a form by ID',
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
      },
      404: { type: 'null' },
    },
  },
};
