import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const OAUTH_REGISTER_POST: RouteOptions = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    const { authenticationService } = getContainer();
    const client = authenticationService.registerClient(request.body);

    if (!client) {
      reply.status(400).send({
        error: 'invalid_client_metadata',
        error_description: 'The client registration is invalid',
      });
      return;
    }

    reply
      .header('Cache-Control', 'no-store')
      .header('Pragma', 'no-cache')
      .status(201)
      .send(client);
  },
  method: 'POST',
  url: '/oauth/register',
};
