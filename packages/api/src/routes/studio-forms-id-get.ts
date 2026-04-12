import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { findFormById, findUserByToken, parseAuthorizationHeader } from '../core';

export const STUDIO_FORMS_ID_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const form = await findFormById(request.params.id);

    if (!form) {
      reply.status(404).send();
      return;
    }

    const collaborators = (form as { collaborators?: string[] }).collaborators;

    if (collaborators && collaborators.length > 0) {
      const token = parseAuthorizationHeader(request.headers.authorization);
      const user = token ? await findUserByToken(token) : null;
      if (!user?.email || !collaborators.includes(user.email)) {
        throw new Error(`Not authorized to view studio form: ${request.params.id}`);
      }
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
