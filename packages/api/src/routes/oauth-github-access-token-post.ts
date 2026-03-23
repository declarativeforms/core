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
      summary: 'Exchange GitHub OAuth code for an access token',
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
            access_token: { type: 'string' },
            id: { type: 'string' },
          },
        },
      },
    },
  };
