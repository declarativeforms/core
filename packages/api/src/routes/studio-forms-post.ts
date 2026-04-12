import type { IDeclarativeForm } from '@declarativeforms/types';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { createStudioForm, findUserByToken, parseAuthorizationHeader } from '../core';

export const STUDIO_FORMS_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: IDeclarativeForm;
    }>,
    reply: FastifyReply,
  ) => {
    const token = parseAuthorizationHeader(request.headers.authorization);
    const user = token ? await findUserByToken(token) : null;

    if (!user?.email) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const form = await createStudioForm(request.body, user.email);
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
