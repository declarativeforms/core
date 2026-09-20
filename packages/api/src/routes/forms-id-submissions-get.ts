import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;
const MAXIMUM_LIMIT = 500;
const MAXIMUM_PAGE = Math.floor(Number.MAX_SAFE_INTEGER / MAXIMUM_LIMIT);

export const FORMS_ID_SUBMISSIONS_GET: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 30,
      timeWindow: '1 minute',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { limit: number; page: number };
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { submissionService } = await getContainer();

    reply.header('Cache-Control', 'no-store');

    const submissions = await submissionService.list(
      request.params.id,
      /^Bearer ([^\s]+)$/i.exec(request.headers.authorization ?? '')?.[1] ?? '',
      request.query.page,
      request.query.limit,
    );

    if (!submissions) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send(submissions);
  },
  method: 'GET',
  schema: {
    querystring: {
      properties: {
        limit: {
          default: DEFAULT_LIMIT,
          maximum: MAXIMUM_LIMIT,
          minimum: 1,
          type: 'integer',
        },
        page: {
          default: DEFAULT_PAGE,
          maximum: MAXIMUM_PAGE,
          minimum: 1,
          type: 'integer',
        },
      },
      type: 'object',
    },
  },
  url: '/api/v1/forms/:id/submissions',
};
