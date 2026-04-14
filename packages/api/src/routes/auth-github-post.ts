import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const AUTH_GITHUB_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { code: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { authService } = await getContainer();
    const result = await authService.findTokenAndUserByGitHubCode(
      request.body.code,
    );

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
};
