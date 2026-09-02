import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const AUTH_TOKEN_POST: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: '5 minutes',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Body: { auth_code?: unknown };
    }>,
    reply: FastifyReply,
  ) => {
    const authCode =
      request.body && typeof request.body.auth_code === 'string'
        ? request.body.auth_code
        : '';

    if (!authCode) {
      reply.status(400).send();

      return;
    }

    const { authenticationService, organizationService } = await getContainer();

    if (!authenticationService.isConfigured()) {
      reply.status(503).send();

      return;
    }

    const email = await authenticationService.consumeAuthCode(authCode);

    if (!email) {
      reply.status(401).send();

      return;
    }

    await organizationService.ensurePersonalWorkspace(email);

    const expiresIn = authenticationService.accessTokenTtlSeconds();
    const accessToken = await reply.jwtSign(
      { provider: 'github', sub: email },
      { expiresIn },
    );

    reply.header('Cache-Control', 'no-store');
    reply.status(200).send({
      access_token: accessToken,
      expires_in: expiresIn,
      token_type: 'Bearer',
    });
  },
  method: 'POST',
  url: '/api/v1/auth/token',
};
