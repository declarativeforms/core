import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const AUTH_PROVIDER_CALLBACK_GET: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 20,
      timeWindow: '5 minutes',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Params: { provider: string };
      Querystring: { code?: string; state?: string };
    }>,
    reply: FastifyReply,
  ) => {
    const code =
      typeof request.query.code === 'string' ? request.query.code : '';
    const state =
      typeof request.query.state === 'string' ? request.query.state : '';

    if (!code || !state) {
      reply.status(400).send();

      return;
    }

    const { authenticationService } = await getContainer();

    if (!authenticationService.isConfigured()) {
      reply.status(503).send();

      return;
    }

    const url = await authenticationService.completeAuthorization(
      request.params.provider,
      code,
      state,
    );

    if (!url) {
      reply.status(401).send();

      return;
    }

    reply.header('Cache-Control', 'no-store');
    reply.redirect(url, 302);
  },
  method: 'GET',
  url: '/api/v1/auth/:provider/callback',
};
