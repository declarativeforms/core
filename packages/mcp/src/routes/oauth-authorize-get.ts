import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

type AuthorizationQuery = {
  client_id?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  redirect_uri?: string;
  resource?: string;
  response_type?: string;
  scope?: string;
  state?: string;
};

export const OAUTH_AUTHORIZE_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{ Querystring: AuthorizationQuery }>,
    reply: FastifyReply,
  ) => {
    const { authenticationService } = getContainer();
    const url = authenticationService.beginAuthorization({
      clientId: request.query.client_id,
      codeChallenge: request.query.code_challenge,
      codeChallengeMethod: request.query.code_challenge_method,
      redirectUri: request.query.redirect_uri,
      resource: request.query.resource,
      responseType: request.query.response_type,
      scope: request.query.scope,
      state: request.query.state,
    });

    if (!url) {
      reply.status(400).send({
        error: 'invalid_request',
        error_description: 'The authorization request is invalid',
      });
      return;
    }

    reply.header('Cache-Control', 'no-store').redirect(url);
  },
  method: 'GET',
  url: '/oauth/authorize',
};
