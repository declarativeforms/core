import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const AUTH_MAGIC_LINK_VERIFY_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { request_id: string; token: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { authService, studioMagicLinkService } = await getContainer();

    const username = await studioMagicLinkService.verifyToken({
      requestId: request.body.request_id,
      token: request.body.token,
    });

    if (!username) {
      reply.status(401).send({ error: 'Invalid or expired magic link' });
      return;
    }

    const user = {
      username,
    };

    const token = authService.sign(user);

    reply.status(200).send({
      token,
      user,
    });
  },
  method: 'POST',
  url: '/api/v1/auth/magic-link/verify',
};
