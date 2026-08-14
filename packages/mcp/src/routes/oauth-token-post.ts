import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

type TokenBody = {
  client_id?: string;
  code?: string;
  code_verifier?: string;
  grant_type?: string;
  redirect_uri?: string;
  refresh_token?: string;
  resource?: string;
};

export const OAUTH_TOKEN_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{ Body: TokenBody }>,
    reply: FastifyReply,
  ) => {
    if (
      !['authorization_code', 'refresh_token'].includes(
        request.body.grant_type || '',
      )
    ) {
      reply.status(400).send({ error: 'unsupported_grant_type' });
      return;
    }

    const { authenticationService } = getContainer();
    const tokens = await authenticationService.exchangeToken({
      clientId: request.body.client_id,
      code: request.body.code,
      codeVerifier: request.body.code_verifier,
      grantType: request.body.grant_type,
      redirectUri: request.body.redirect_uri,
      refreshToken: request.body.refresh_token,
      resource: request.body.resource,
    });

    if (!tokens) {
      reply.status(400).send({ error: 'invalid_grant' });
      return;
    }

    reply
      .header('Cache-Control', 'no-store')
      .header('Pragma', 'no-cache')
      .status(200)
      .send(tokens);
  },
  method: 'POST',
  url: '/oauth/token',
};
