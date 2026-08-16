import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { createDeclarativeFormsServer } from '../mcp';

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

type CallbackQuery = {
  code?: string;
  error?: string;
  state?: string;
};

type TokenBody = {
  client_id?: string;
  code?: string;
  code_verifier?: string;
  grant_type?: string;
  redirect_uri?: string;
  resource?: string;
};

export const MCP: RouteOptions = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    const { formService, mcpAuthentication } = await getContainer();
    const token = getBearerToken(request.headers.authorization);
    const access = token ? mcpAuthentication.verifyAccessToken(token) : null;

    if (!access) {
      reply
        .header('WWW-Authenticate', mcpAuthentication.getBearerChallenge())
        .status(401)
        .send({ error: 'invalid_token' });
      return;
    }

    if (request.method !== 'POST') {
      reply.status(405).send({
        error: { code: -32000, message: 'Method not allowed.' },
        id: null,
        jsonrpc: '2.0',
      });
      return;
    }

    const body = parseJson(request.body);

    if (!body) {
      reply.status(400).send({
        error: { code: -32700, message: 'Parse error' },
        id: null,
        jsonrpc: '2.0',
      });
      return;
    }

    const server = createDeclarativeFormsServer(
      formService,
      access.githubToken,
    );
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    try {
      await server.connect(transport);
      reply.hijack();
      reply.raw.on('close', () => {
        void transport.close();
        void server.close();
      });
      await transport.handleRequest(request.raw, reply.raw, body);
    } catch {
      if (!reply.raw.headersSent) {
        reply.raw.writeHead(500, { 'Content-Type': 'application/json' });
        reply.raw.end(
          JSON.stringify({
            error: { code: -32603, message: 'Internal server error' },
            id: null,
            jsonrpc: '2.0',
          }),
        );
      }
    }
  },
  method: ['GET', 'POST', 'DELETE'],
  url: '/mcp',
};

const AUTHORIZATION_SERVER_METADATA: RouteOptions = {
  handler: async (_request: FastifyRequest, reply: FastifyReply) => {
    const { mcpAuthentication } = await getContainer();

    reply
      .header('Cache-Control', 'public, max-age=3600')
      .status(200)
      .send(mcpAuthentication.getAuthorizationServerMetadata());
  },
  method: 'GET',
  url: '/.well-known/oauth-authorization-server',
};

const PROTECTED_RESOURCE_METADATA: RouteOptions = {
  handler: async (_request: FastifyRequest, reply: FastifyReply) => {
    const { mcpAuthentication } = await getContainer();

    reply
      .header('Cache-Control', 'public, max-age=3600')
      .status(200)
      .send(mcpAuthentication.getProtectedResourceMetadata());
  },
  method: 'GET',
  url: '/.well-known/oauth-protected-resource/mcp',
};

const REGISTER: RouteOptions = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    const { mcpAuthentication } = await getContainer();
    const client = mcpAuthentication.registerClient(parseJson(request.body));

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

const AUTHORIZE: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{ Querystring: AuthorizationQuery }>,
    reply: FastifyReply,
  ) => {
    const { mcpAuthentication } = await getContainer();
    const url = mcpAuthentication.beginAuthorization({
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

const CALLBACK: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{ Querystring: CallbackQuery }>,
    reply: FastifyReply,
  ) => {
    if (!request.query.state) {
      reply.status(400).send({ error: 'invalid_request' });
      return;
    }

    const { mcpAuthentication } = await getContainer();
    const url = mcpAuthentication.completeAuthorization(
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

const TOKEN: RouteOptions = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    const body = parseTokenBody(request.body, request.headers['content-type']);

    if (!body || body.grant_type !== 'authorization_code') {
      reply.status(400).send({ error: 'unsupported_grant_type' });
      return;
    }

    const { mcpAuthentication } = await getContainer();
    const tokens = await mcpAuthentication.exchangeToken({
      clientId: body.client_id,
      code: body.code,
      codeVerifier: body.code_verifier,
      grantType: body.grant_type,
      redirectUri: body.redirect_uri,
      resource: body.resource,
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

export const MCP_ROUTES = [
  AUTHORIZATION_SERVER_METADATA,
  PROTECTED_RESOURCE_METADATA,
  REGISTER,
  AUTHORIZE,
  CALLBACK,
  TOKEN,
  MCP,
];

function getBearerToken(authorization: string | undefined): string | null {
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim() || null;
}

function parseJson(value: unknown): unknown | null {
  if (!Buffer.isBuffer(value)) {
    return typeof value === 'object' && value !== null ? value : null;
  }

  try {
    return JSON.parse(value.toString('utf8')) as unknown;
  } catch {
    return null;
  }
}

function parseTokenBody(
  value: unknown,
  contentType: string | undefined,
): TokenBody | null {
  if (!Buffer.isBuffer(value)) {
    return typeof value === 'object' && value !== null
      ? (value as TokenBody)
      : null;
  }

  if (contentType?.includes('application/json')) {
    return parseJson(value) as TokenBody | null;
  }

  return Object.fromEntries(
    new URLSearchParams(value.toString('utf8')).entries(),
  );
}
