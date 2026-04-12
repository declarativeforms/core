import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { findUserByToken, listStudioForms, parseAuthorizationHeader } from '../core';

export const STUDIO_FORMS_GET: RouteOptions<any, any, any, any> = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    const token = parseAuthorizationHeader(request.headers.authorization);
    const user = token ? await findUserByToken(token) : null;

    const forms = await listStudioForms(user?.email ?? null);
    reply.status(200).send(forms);
  },
  method: 'GET',
  url: '/api/v1/studio/forms',
  schema: {
    tags: ['studio'],
    summary: 'List studio forms for the authenticated user',
    response: {
      200: {
        type: 'array',
        items: { type: 'object', additionalProperties: true },
      },
    },
  },
};
