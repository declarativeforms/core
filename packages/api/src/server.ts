import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import * as qs from 'qs';
import {
  AUTH_DEMO_POST,
  AUTH_GITHUB_POST,
  AUTH_MAGIC_LINK_SEND_POST,
  AUTH_MAGIC_LINK_VERIFY_POST,
  AUTH_ME_GET,
  FILES_UPLOAD_POST,
  FORMS_ID_GET,
  FORMS_ID_SUBMISSIONS_GET,
  FORMS_ID_SUBMISSIONS_ID_GET,
  FORMS_ID_SUBMISSIONS_POST,
  FORMS_SLUG_GET,
  OAUTH_GITHUB_ACCESS_TOKEN_POST,
  STUDIO_FORMS_GET,
  STUDIO_FORMS_ID_DELETE,
  STUDIO_FORMS_ID_GET,
  STUDIO_FORMS_ID_PUT,
  STUDIO_FORMS_ID_SUBMISSIONS_GET,
  STUDIO_FORMS_POST,
} from './routes';
import { requireStudioAuth } from './middleware';

export async function startServer() {
  const server = fastify({
    bodyLimit: 10 * 1048576, // 10MB
    logger: true,
    routerOptions: {
      caseSensitive: false,
      ignoreDuplicateSlashes: true,
      ignoreTrailingSlash: true,
      querystringParser: (str) => qs.parse(str),
    },
  });

  await server.register(fastifyCors, {
    allowedHeaders: '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    origin: '*',
  });

  await server.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1048576, // 10MB
    },
  });

  await server.addContentTypeParser(
    '*',
    { parseAs: 'buffer' },
    (
      request: any,
      payload: any,
      done: (error: Error | null, body: Buffer) => void,
    ) => {
      done(null, payload);
    },
  );

  server.route(AUTH_DEMO_POST);
  server.route(AUTH_GITHUB_POST);
  server.route(AUTH_MAGIC_LINK_SEND_POST);
  server.route(AUTH_MAGIC_LINK_VERIFY_POST);
  server.route(AUTH_ME_GET);
  server.route(FILES_UPLOAD_POST);
  server.route(FORMS_ID_GET);
  server.route(FORMS_ID_SUBMISSIONS_GET);
  server.route(FORMS_ID_SUBMISSIONS_ID_GET);
  server.route(FORMS_ID_SUBMISSIONS_POST);
  server.route(FORMS_SLUG_GET);
  server.route(OAUTH_GITHUB_ACCESS_TOKEN_POST);
  server.route({
    ...STUDIO_FORMS_GET,
    preHandler: requireStudioAuth,
  });
  server.route({
    ...STUDIO_FORMS_POST,
    preHandler: requireStudioAuth,
  });
  server.route({
    ...STUDIO_FORMS_ID_GET,
    preHandler: requireStudioAuth,
  });
  server.route({
    ...STUDIO_FORMS_ID_PUT,
    preHandler: requireStudioAuth,
  });
  server.route({
    ...STUDIO_FORMS_ID_DELETE,
    preHandler: requireStudioAuth,
  });
  server.route({
    ...STUDIO_FORMS_ID_SUBMISSIONS_GET,
    preHandler: requireStudioAuth,
  });

  server.route({
    handler: async (_request, reply) => {
      reply.status(200).send();
    },
    method: 'GET',
    url: '/',
  });

  server.route({
    handler: async (request, reply) => {
      try {
        reply.status(200).send();
      } catch {
        reply.status(503).send();
      }
    },
    method: 'GET',
    url: '/api/v1/health',
  });

  server.route({
    handler: async (request, reply) => {
      reply.status(200).send(request.headers);
    },
    method: 'GET',
    url: '/api/v1/headers',
  });

  server.route({
    handler: async (request, reply) => {
      reply.status(200).send();
    },
    method: 'GET',
    url: '/api/v1/ping',
  });

  await server.listen({
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
  });

  await server.ready();
}
