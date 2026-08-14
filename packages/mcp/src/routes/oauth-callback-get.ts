import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

type CallbackQuery = {
  code?: string;
  error?: string;
  state?: string;
};

export const OAUTH_CALLBACK_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{ Querystring: CallbackQuery }>,
    reply: FastifyReply,
  ) => {
    if (!request.query.state) {
      reply.status(400).send({ error: 'invalid_request' });
      return;
    }

    const { authenticationService } = getContainer();
    const url = authenticationService.completeAuthorization(
      request.query.state,
      request.query.code,
      request.query.error,
    );

    if (!url) {
      reply.status(400).send({ error: 'invalid_request' });
      return;
    }

    reply.header('Cache-Control', 'no-store').redirect(url);
  },
  method: 'GET',
  url: '/oauth/callback',
};
