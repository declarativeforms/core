import fastify from 'fastify';
import {
  MCP_POST,
  OAUTH_AUTHORIZATION_SERVER_GET,
  OAUTH_AUTHORIZE_GET,
  OAUTH_CALLBACK_GET,
  OAUTH_PROTECTED_RESOURCE_GET,
  OAUTH_REGISTER_POST,
  OAUTH_TOKEN_POST,
} from './routes';

export async function startServer() {
  const server = fastify({
    bodyLimit: 1024 * 1024,
    logger: true,
    routerOptions: {
      caseSensitive: false,
      ignoreDuplicateSlashes: true,
      ignoreTrailingSlash: true,
    },
  });

  server.addContentTypeParser(
    'application/x-www-form-urlencoded',
    { parseAs: 'string' },
    (_request, payload, done) => {
      done(null, Object.fromEntries(new URLSearchParams(payload.toString())));
    },
  );

  server.route(MCP_POST);
  server.route(OAUTH_AUTHORIZATION_SERVER_GET);
  server.route(OAUTH_AUTHORIZE_GET);
  server.route(OAUTH_CALLBACK_GET);
  server.route(OAUTH_PROTECTED_RESOURCE_GET);
  server.route(OAUTH_REGISTER_POST);
  server.route(OAUTH_TOKEN_POST);

  server.route({
    handler: async (_request, reply) => {
      reply.status(200).send();
    },
    method: 'GET',
    url: '/',
  });

  server.route({
    handler: async (_request, reply) => {
      reply.status(200).send();
    },
    method: 'GET',
    url: '/health',
  });

  await server.listen({
    host: '0.0.0.0',
    port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 8081,
  });

  await server.ready();
}
