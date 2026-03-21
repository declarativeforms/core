import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { createGitHubConnection } from '../core';

export const OAUTH_GITHUB_ACCESS_TOKEN_POST: RouteOptions<any, any, any, any> =
  {
    handler: async (
      request: FastifyRequest<{
        Body: { code: string };
      }>,
      reply: FastifyReply,
    ) => {
      const result = await createGitHubConnection(request.body.code);

      reply
        .status(200)
        .send({ access_token: result.accessToken, id: result.id });
    },
    method: 'POST',
    url: '/api/v1/oauth/github/access_token',
    schema: {
      tags: ['oauth2'],
      body: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' },
        },
      },
    },
  };
