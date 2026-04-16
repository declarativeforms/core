import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const AUTH_MAGIC_LINK_VERIFY_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { request_id: string; salt: string; token: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { authService, emailVerificationService } = await getContainer();

    const username = await emailVerificationService.verify(
      request.body.request_id,
      request.body.salt,
      request.body.token,
    );

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
