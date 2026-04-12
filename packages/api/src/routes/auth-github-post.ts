import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { findTokenAndUserByCode } from '../core';

export const AUTH_GITHUB_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { code: string };
    }>,
    reply: FastifyReply,
  ) => {
    const result = await findTokenAndUserByCode(request.body.code);

    if (!result) {
      reply.status(401).send({ error: 'Authentication failed' });
      return;
    }

    reply.status(200).send({
      token: result.token,
      user: result.user,
    });
  },
  method: 'POST',
  url: '/api/v1/auth/github',
  schema: {
    tags: ['auth'],
    summary: 'Authenticate with GitHub OAuth code',
    body: {
      type: 'object',
      required: ['code'],
      properties: {
        code: { type: 'string' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              login: { type: 'string' },
              name: { type: 'string', nullable: true },
              avatar_url: { type: 'string' },
              email: { type: 'string', nullable: true },
            },
          },
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
