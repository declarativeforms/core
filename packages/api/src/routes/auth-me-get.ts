import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { findUserByToken, parseAuthorizationHeader } from '../core';

export const AUTH_ME_GET: RouteOptions<any, any, any, any> = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    const token = parseAuthorizationHeader(request.headers.authorization);

    if (!token) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const user = await findUserByToken(token);

    if (!user) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }

    reply.status(200).send({
      github_id: user.github_id,
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
    });
  },
  method: 'GET',
  url: '/api/v1/auth/me',
  schema: {
    tags: ['auth'],
    summary: 'Get the currently authenticated user',
    response: {
      200: {
        type: 'object',
        properties: {
          github_id: { type: 'number' },
          login: { type: 'string' },
          name: { type: 'string', nullable: true },
          avatar_url: { type: 'string' },
        },
      },
      401: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
};
