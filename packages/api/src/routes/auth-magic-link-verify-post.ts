import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { verifyStudioMagicLinkToken } from '../core';

export const AUTH_MAGIC_LINK_VERIFY_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { request_id: string; token: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { request_id, token } = request.body;

    if (!request_id || !token) {
      reply.status(400).send({ error: 'request_id and token are required' });
      return;
    }

    const result = await verifyStudioMagicLinkToken(request_id, token);

    if (!result) {
      reply.status(401).send({ error: 'Invalid or expired magic link' });
      return;
    }

    reply.status(200).send({
      token: result.token,
      user: result.user,
    });
  },
  method: 'POST',
  url: '/api/v1/auth/magic-link/verify',
  schema: {
    tags: ['auth'],
    summary: 'Verify a magic link token for Studio authentication',
    body: {
      type: 'object',
      required: ['request_id', 'token'],
      properties: {
        request_id: { type: 'string' },
        token: { type: 'string' },
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
            },
          },
        },
      },
      400: {
        type: 'object',
        properties: {
          error: { type: 'string' },
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
