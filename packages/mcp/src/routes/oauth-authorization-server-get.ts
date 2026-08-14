import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const OAUTH_AUTHORIZATION_SERVER_GET: RouteOptions = {
  handler: async (_request: FastifyRequest, reply: FastifyReply) => {
    const { authenticationService } = getContainer();

    reply
      .header('Access-Control-Allow-Origin', '*')
      .header('Cache-Control', 'public, max-age=3600')
      .status(200)
      .send(authenticationService.getOAuthMetadata());
  },
  method: 'GET',
  url: '/.well-known/oauth-authorization-server',
};
