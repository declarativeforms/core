import type { IDeclarativeForm } from '@declarativeforms/types';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { createStudioForm } from '../core';

export const STUDIO_FORMS_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: IDeclarativeForm;
    }>,
    reply: FastifyReply,
  ) => {
    const form = await createStudioForm(request.body);
    reply.status(201).send(form);
  },
  method: 'POST',
  url: '/api/v1/studio/forms',
  schema: {
    tags: ['studio'],
    summary: 'Create a new studio form',
    body: {
      type: 'object',
      additionalProperties: true,
    },
    response: {
      201: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
};
