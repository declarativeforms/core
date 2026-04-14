import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const OAUTH_GITHUB_ACCESS_TOKEN_POST: RouteOptions<any, any, any, any> =
  {
    handler: async (
      request: FastifyRequest<{
        Body: { code: string };
      }>,
      reply: FastifyReply,
    ) => {
      const { gitHubGateway } = await getContainer();
      const accessToken = await gitHubGateway.findAccessToken(request.body.code);

      if (!accessToken) {
        reply.status(401).send({ error: 'Authentication failed' });
        return;
      }

      reply.status(200).send({ access_token: accessToken });
    },
    method: 'POST',
    url: '/api/v1/oauth/github/access_token',
  };
