import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

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

    const { authService, studioMagicLinkService } = await getContainer();
    const email = await studioMagicLinkService.verifyToken({
      requestId: request_id,
      token,
    });

    if (!email) {
      reply.status(401).send({ error: 'Invalid or expired magic link' });
      return;
    }

    const authResult = authService.issueTokenAndUser(
      authService.createStudioEmailUser(email),
    );

    reply.status(200).send({
      token: authResult.token,
      user: authResult.user,
    });
  },
  method: 'POST',
  url: '/api/v1/auth/magic-link/verify',
};
