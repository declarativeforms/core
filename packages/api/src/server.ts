import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastify, { type FastifyInstance } from 'fastify';
import { checkDependencies, disposeContainer } from './core';
import { requireApiKey } from './middleware';
import {
  sendFormSourceError,
  sendInvalidDefinition,
  sendInvalidYaml,
} from './routes/error-response';
import {
  EMAIL_CHALLENGES_SEND_POST,
  EMAIL_CHALLENGES_VERIFY_POST,
  FILES_KEY_GET,
  FILES_UPLOAD_POST,
  FORMS_ID_GET,
  FORMS_ID_UPLOAD_CAPABILITIES_POST,
  FORMS_ID_SUBMISSIONS_GET,
  FORMS_ID_SUBMISSIONS_ID_GET,
  FORMS_ID_SUBMISSIONS_POST,
  FORMS_ID_SUBMISSIONS_RESUME_GET,
  FORMS_SLUG_GET,
} from './routes';

export async function buildServer(): Promise<FastifyInstance> {
  const server = fastify({
    bodyLimit: 1024 * 1024,
    logger: true,
    trustProxy: [
      '127.0.0.1',
      '::1',
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16',
    ],
    routerOptions: {
      caseSensitive: false,
      ignoreDuplicateSlashes: true,
      ignoreTrailingSlash: true,
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

  server.addHook('onSend', async (_request, reply) => {
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('X-Content-Type-Options', 'nosniff');
  });

  server.route(EMAIL_CHALLENGES_SEND_POST);
  server.route(EMAIL_CHALLENGES_VERIFY_POST);
  server.route(FILES_KEY_GET);
  server.route(FILES_UPLOAD_POST);
  server.route(FORMS_ID_GET);
  server.route(FORMS_ID_SUBMISSIONS_POST);
  server.route(FORMS_ID_SUBMISSIONS_RESUME_GET);
  server.route(FORMS_ID_UPLOAD_CAPABILITIES_POST);
  server.route(FORMS_SLUG_GET);

  server.route({
    handler: async (_request, reply) => {
      await checkDependencies();
      reply.status(200).send({ status: 'ready' });
    },
    method: 'GET',
    url: '/api/v1/ready',
  });
  server.route({
    ...FORMS_ID_SUBMISSIONS_GET,
    preHandler: requireApiKey,
  });
  server.route({
    ...FORMS_ID_SUBMISSIONS_ID_GET,
    preHandler: requireApiKey,
  });

  server.route({
    handler: async (_request, reply) => {
      reply.status(200).send({ status: 'ok' });
    },
    method: 'GET',
    url: '/api/v1/health',
  });

  server.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found.',
      },
    });
  });

  server.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    if (
      sendInvalidYaml(reply, error) ||
      sendInvalidDefinition(reply, error) ||
      sendFormSourceError(reply, error)
    ) {
      return;
    }

    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number' &&
      error.statusCode < 500
        ? error.statusCode
        : 500;
    const message =
      statusCode < 500 && error instanceof Error
        ? error.message
        : 'The server could not complete the request.';

    reply.status(statusCode).send({
      error: {
        code: statusCode < 500 ? 'INVALID_REQUEST' : 'INTERNAL_SERVER_ERROR',
        message,
      },
    });
  });

  server.addHook('onClose', async () => {
    await disposeContainer();
  });

  await server.ready();

  return server;
}

export async function startServer(): Promise<FastifyInstance> {
  const server = await buildServer();

  await server.listen({
    host: '0.0.0.0',
    port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 8080,
  });

  return server;
}
