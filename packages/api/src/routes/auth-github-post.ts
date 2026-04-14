import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const AUTH_GITHUB_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { code: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { authService, gitHubGateway } = await getContainer();

    const accessToken = await gitHubGateway.findAccessToken(request.body.code);

    if (!accessToken) {
      reply.status(401).send();

      return;
    }

    const user = await gitHubGateway.findUser(accessToken);

    if (!user) {
      reply.status(401).send();

      return;
    }

    reply.status(200).send({
      token: authService.sign(user),
      user,
    });
  },
  method: 'POST',
  url: '/api/v1/auth/github',
};
