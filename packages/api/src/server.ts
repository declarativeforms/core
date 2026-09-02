import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import fastifyRateLimit from '@fastify/rate-limit';
import fastify, { type FastifyError } from 'fastify';
import { randomBytes } from 'node:crypto';
import * as qs from 'qs';
import { getContainer, HttpError } from './core';
import {
  AUTH_ME_GET,
  AUTH_PROVIDER_AUTHORIZE_GET,
  AUTH_PROVIDER_CALLBACK_GET,
  AUTH_TOKEN_POST,
  CONFIG_GET,
  FILES_KEY_GET,
  FILES_UPLOAD_POST,
  FORMS_ID_GET,
  FORMS_ID_SUBMISSIONS_ID_GET,
  FORMS_ID_SUBMISSIONS_POST,
  FORMS_SLUG_GET,
  ORGANIZATIONS_GET,
  ORGANIZATIONS_ID_FORMS_GENERATE_POST,
  ORGANIZATIONS_ID_FORMS_GET,
  ORGANIZATIONS_ID_FORMS_ID_BRANCHES_GET,
  ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_DELETE,
  ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_GET,
  ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_MESSAGES_GET,
  ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_MESSAGES_POST,
  ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_PUBLISH_POST,
  ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_YAML_GET,
  ORGANIZATIONS_ID_FORMS_ID_BRANCHES_POST,
  ORGANIZATIONS_ID_FORMS_ID_DELETE,
  ORGANIZATIONS_ID_FORMS_ID_PATCH,
  ORGANIZATIONS_ID_FORMS_ID_PUT,
  ORGANIZATIONS_ID_FORMS_POST,
  ORGANIZATIONS_ID_GET,
  ORGANIZATIONS_ID_MEMBERS_EMAIL_DELETE,
  ORGANIZATIONS_ID_MEMBERS_POST,
  ORGANIZATIONS_POST,
} from './routes';

const JWT_AUDIENCE = 'declarativeforms-api';
const JWT_ISSUER = 'declarativeforms';
const STRICT_CORS_PREFIXES = ['/api/v1/auth/', '/api/v1/organizations'];

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
    trustProxy: (_address: string, hop: number) => hop === 0,
  });

  server.setErrorHandler((error: FastifyError, _request, reply) => {
    const statusCode = error.statusCode ?? 500;
    const payload = (error as unknown as HttpError).payload;

    if (statusCode < 500 || payload) {
      reply
        .status(statusCode)
        .send(payload ?? { errors: { '/': error.message } });

      return;
    }

    console.error(error);

    reply.status(500).send();
  });

  const allowedOrigins = (process.env.AUTH_ALLOWED_ORIGINS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  await server.register(fastifyCors, () => (request: any, callback: any) => {
    const path = String(request.url || '').split('?')[0];
    const isStrict = STRICT_CORS_PREFIXES.some((prefix) =>
      path.startsWith(prefix),
    );

    callback(null, {
      allowedHeaders: ['authorization', 'content-type'],
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      origin: isStrict ? allowedOrigins : '*',
    });
  });

  await server.register(fastifyJwt, {
    secret: process.env.AUTH_JWT_SECRET || randomBytes(32).toString('hex'),
    sign: {
      algorithm: 'HS256',
      aud: JWT_AUDIENCE,
      iss: JWT_ISSUER,
    },
    verify: {
      algorithms: ['HS256'],
      allowedAud: JWT_AUDIENCE,
      allowedIss: JWT_ISSUER,
    },
  });

  await server.register(fastifyRateLimit, {
    addHeadersOnExceeding: {
      'x-ratelimit-limit': false,
      'x-ratelimit-remaining': false,
      'x-ratelimit-reset': false,
    },
    errorResponseBuilder: (_request, context) =>
      Object.assign(new Error('too many requests'), {
        statusCode: context.statusCode,
      }),
    global: false,
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

  server.decorateRequest('email', null);
  server.decorateRequest('organization', null);

  const {
    authenticationService,
    formMessageService,
    formService,
    organizationService,
    submissionService,
  } = await getContainer();

  await authenticationService.ensureIndexes();
  await formMessageService.ensureIndexes();
  await formService.ensureIndexes();
  await organizationService.ensureIndexes();
  await submissionService.ensureIndexes();

  server.route(AUTH_ME_GET);
  server.route(AUTH_PROVIDER_AUTHORIZE_GET);
  server.route(AUTH_PROVIDER_CALLBACK_GET);
  server.route(AUTH_TOKEN_POST);
  server.route(CONFIG_GET);
  server.route(FILES_KEY_GET);
  server.route(FILES_UPLOAD_POST);
  server.route(FORMS_ID_GET);
  server.route(FORMS_ID_SUBMISSIONS_ID_GET);
  server.route(FORMS_ID_SUBMISSIONS_POST);
  server.route(FORMS_SLUG_GET);
  server.route(ORGANIZATIONS_GET);
  server.route(ORGANIZATIONS_ID_FORMS_GENERATE_POST);
  server.route(ORGANIZATIONS_ID_FORMS_GET);
  server.route(ORGANIZATIONS_ID_FORMS_ID_BRANCHES_GET);
  server.route(ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_DELETE);
  server.route(ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_GET);
  server.route(ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_MESSAGES_GET);
  server.route(ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_MESSAGES_POST);
  server.route(ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_PUBLISH_POST);
  server.route(ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_YAML_GET);
  server.route(ORGANIZATIONS_ID_FORMS_ID_BRANCHES_POST);
  server.route(ORGANIZATIONS_ID_FORMS_ID_DELETE);
  server.route(ORGANIZATIONS_ID_FORMS_ID_PATCH);
  server.route(ORGANIZATIONS_ID_FORMS_ID_PUT);
  server.route(ORGANIZATIONS_ID_FORMS_POST);
  server.route(ORGANIZATIONS_ID_GET);
  server.route(ORGANIZATIONS_ID_MEMBERS_EMAIL_DELETE);
  server.route(ORGANIZATIONS_ID_MEMBERS_POST);
  server.route(ORGANIZATIONS_POST);

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
