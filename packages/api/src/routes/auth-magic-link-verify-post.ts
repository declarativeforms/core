import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const AUTH_MAGIC_LINK_VERIFY_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { request_id: string; salt: string; token: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { authService, studioMagicLinkService } = await getContainer();

    const username = await studioMagicLinkService.verify({
      requestId: request.body.request_id,
      salt: request.body.salt,
      token: request.body.token,
    });

    if (!username) {
      reply.status(401).send();

      return;
    }

    const user = {
      username,
    };

    reply.status(200).send({
      token: authService.sign(user),
      user,
    });
  },
  method: 'POST',
  url: '/api/v1/auth/magic-link/verify',
};
