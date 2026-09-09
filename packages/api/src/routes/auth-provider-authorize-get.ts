import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const AUTH_PROVIDER_AUTHORIZE_GET: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 20,
      timeWindow: '5 minutes',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Params: { provider: string };
      Querystring: { redirect_uri?: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { authenticationService } = await getContainer();

    if (!authenticationService.isConfigured()) {
      reply.status(503).send();

      return;
    }

    const url = authenticationService.buildAuthorizationUrl(
      request.params.provider,
      typeof request.query.redirect_uri === 'string'
        ? request.query.redirect_uri
        : '',
    );

    if (!url) {
      reply.status(404).send();

      return;
    }

    reply.header('Cache-Control', 'no-store');
    reply.redirect(url, 302);
  },
  method: 'GET',
  url: '/api/v1/auth/:provider/authorize',
};
