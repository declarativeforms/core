import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const AUTH_DEMO_POST: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 30,
      timeWindow: '1 minute',
    },
  },
  handler: async (_request: FastifyRequest, reply: FastifyReply) => {
    const email = (process.env.DEMO_USER_EMAIL || '').trim().toLowerCase();

    if (!email) {
      reply.status(404).send();

      return;
    }

    const { authenticationService, organizationService } = await getContainer();

    if (!authenticationService.isConfigured() || !email.includes('@')) {
      reply.status(503).send();

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
  url: '/api/v1/auth/demo',
};
