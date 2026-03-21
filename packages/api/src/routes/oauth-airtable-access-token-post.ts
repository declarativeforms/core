import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { createAirtableConnection } from '../core';

export const OAUTH_AIRTABLE_ACCESS_TOKEN_POST: RouteOptions<
  any,
  any,
  any,
  any
> = {
  handler: async (
    request: FastifyRequest<{
      Body: { code: string; redirect_uri: string; code_verifier: string };
    }>,
    reply: FastifyReply,
  ) => {
    const result = await createAirtableConnection({
      code: request.body.code,
      codeVerifier: request.body.code_verifier,
      redirectUri: request.body.redirect_uri,
    });

    reply.status(200).send({
      id: result.id,
    });
  },
  method: 'POST',
  url: '/api/v1/oauth/airtable/access_token',
  schema: {
    tags: ['oauth2'],
    body: {
      type: 'object',
      required: ['code', 'redirect_uri', 'code_verifier'],
      properties: {
        code: { type: 'string' },
        redirect_uri: { type: 'string' },
        code_verifier: { type: 'string' },
      },
    },
  },
};
