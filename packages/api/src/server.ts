import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyMiddie from '@fastify/middie';
import fastifyRateLimit from '@fastify/rate-limit';
import fastify, { type FastifyError } from 'fastify';
import * as qs from 'qs';
import { getContainer } from './core';
import {
  FILES_KEY_GET,
  FILES_UPLOAD_POST,
  FORMS_ID_EMAIL_CHALLENGES_POST,
  FORMS_ID_EMAIL_CHALLENGES_VERIFY_POST,
  FORMS_ID_GET,
  FORMS_ID_SUBMISSIONS_ID_GET,
  FORMS_ID_SUBMISSIONS_POST,
  FORMS_ID_TURNSTILE_VERIFY_POST,
  FORMS_OWNER_REPOSITORY_SLUG_GET,
} from './routes';

export async function startServer(): Promise<void> {
  const server = fastify({
    bodyLimit: 10 * 1048576,
    logger: true,
    routerOptions: {
      caseSensitive: false,
      ignoreDuplicateSlashes: true,
      ignoreTrailingSlash: true,
      querystringParser: (str) => qs.parse(str),
    },
    trustProxy: (_address: string, hop: number) => hop === 0,
  });

  server.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error.statusCode) {
      reply.status(error.statusCode).send();

      return;
    }

    console.error(error);

    reply.status(500).send();
  });

  await server.register(fastifyCors, {
    allowedHeaders: ['authorization', 'content-type', 'mcp-protocol-version'],
    methods: ['GET', 'HEAD', 'POST', 'DELETE', 'OPTIONS'],
    origin: '*',
  });

  await server.register(fastifyRateLimit, {
    addHeadersOnExceeding: {
      'x-ratelimit-limit': false,
      'x-ratelimit-remaining': false,
      'x-ratelimit-reset': false,
    },
    global: false,
  });

  await server.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1048576,
    },
  });

  await server.register(fastifyMiddie);

  server.addContentTypeParser(
    'application/x-www-form-urlencoded',
    { parseAs: 'string' },
    (_request, payload, done) => {
      done(
        null,
        qs.parse(
          typeof payload === 'string' ? payload : payload.toString('utf8'),
        ),
      );
    },
  );

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

  const container = await getContainer();
  const {
    formRepository,
    gitHubFileRepository,
    organizationRepository,
    oauthAccountRepository,
    submissionRepository,
  } = container;

  await formRepository.ensureIndexes();
  await gitHubFileRepository.ensureIndexes();
  await organizationRepository.ensureIndexes();
  await oauthAccountRepository.ensureIndexes();
  await submissionRepository.ensureIndexes();

  const oauth = await import('./oauth/provider.js');
  const mcp = await import('./mcp/server.js');

  await oauth.registerOAuth(server, container);
  await mcp.registerMcp(server, container);

  server.route(FILES_KEY_GET);
  server.route(FILES_UPLOAD_POST);
  server.route(FORMS_ID_EMAIL_CHALLENGES_POST);
  server.route(FORMS_ID_EMAIL_CHALLENGES_VERIFY_POST);
  server.route(FORMS_ID_GET);
  server.route(FORMS_ID_SUBMISSIONS_ID_GET);
  server.route(FORMS_ID_SUBMISSIONS_POST);
  server.route(FORMS_ID_TURNSTILE_VERIFY_POST);
  server.route(FORMS_OWNER_REPOSITORY_SLUG_GET);

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
    handler: async (_request, reply) => {
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
