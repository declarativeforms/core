import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastify from 'fastify';
import * as qs from 'qs';
import {
  EMAIL_CHALLENGES_SEND_POST,
  EMAIL_CHALLENGES_VERIFY_POST,
  FILES_KEY_GET,
  FILES_UPLOAD_POST,
  FORMS_ID_GET,
  FORMS_ID_SUBMISSIONS_ID_GET,
  FORMS_ID_SUBMISSIONS_POST,
  FORMS_SLUG_GET,
} from './routes';

export async function startServer() {
  const server = fastify({
    bodyLimit: 10 * 1048576,
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
      fileSize: 10 * 1048576,
    },
  });

  await server.addContentTypeParser(
    '*',
    { parseAs: 'buffer' },
    (
      _request: any,
      payload: any,
      done: (error: Error | null, body: Buffer) => void,
    ) => {
      done(null, payload);
    },
  );

  server.route(EMAIL_CHALLENGES_SEND_POST);
  server.route(EMAIL_CHALLENGES_VERIFY_POST);
  server.route(FILES_KEY_GET);
  server.route(FILES_UPLOAD_POST);
  server.route(FORMS_ID_GET);
  server.route(FORMS_ID_SUBMISSIONS_ID_GET);
  server.route(FORMS_ID_SUBMISSIONS_POST);
  server.route(FORMS_SLUG_GET);

  server.route({
    handler: async (_request, reply) => {
      reply.status(200).send();
    },
    method: 'GET',
    url: '/',
  });

  server.route({
    handler: async (_request, reply) => {
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
    port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 8080,
  });

  await server.ready();
}
