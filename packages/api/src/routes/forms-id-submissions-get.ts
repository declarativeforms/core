import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;
const MAXIMUM_LIMIT = 500;

function readAccessKey(authorization: string | undefined): string {
  const match = /^Bearer ([^\s]+)$/i.exec(authorization ?? '');

  return match?.[1] ?? '';
}

function readPositiveInteger(
  parameter: unknown,
  defaultValue: number,
): number | null {
  if (parameter === undefined) {
    return defaultValue;
  }

  if (typeof parameter !== 'string' || !/^[1-9]\d*$/.test(parameter)) {
    return null;
  }

  const parsed = Number(parameter);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

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
      Querystring: { limit?: unknown; page?: unknown };
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { formService, submissionService } = await getContainer();

    reply.header('Cache-Control', 'no-store');

    if (
      !(await formService.isAuthenticated(
        request.params.id,
        readAccessKey(request.headers.authorization),
      ))
    ) {
      reply.status(404).send();

      return;
    }

    const page = readPositiveInteger(request.query.page, DEFAULT_PAGE);
    const limit = readPositiveInteger(request.query.limit, DEFAULT_LIMIT);

    if (page === null || limit === null || limit > MAXIMUM_LIMIT) {
      reply.status(400).send();

      return;
    }

    const submissions = await submissionService.list(
      request.params.id,
      page,
      limit,
    );

    reply.status(200).send(submissions);
  },
  method: 'GET',
  url: '/api/v1/forms/:id/submissions',
};
