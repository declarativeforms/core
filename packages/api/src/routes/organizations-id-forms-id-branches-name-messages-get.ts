import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

export const ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_MESSAGES_GET: RouteOptions<
  any,
  any,
  any,
  any
> = {
  config: {
    rateLimit: {
      max: 300,
      timeWindow: '1 minute',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Params: { branch: string; id: string };
      Querystring: { cursor?: string; limit?: string };
    }>,
    reply: FastifyReply,
  ) => {
    const cursor =
      typeof request.query.cursor === 'string' && request.query.cursor
        ? request.query.cursor
        : null;

    const limit =
      typeof request.query.limit === 'string'
        ? Number.parseInt(request.query.limit, 10)
        : null;

    if (limit !== null && !Number.isInteger(limit)) {
      reply.status(400).send();

      return;
    }

    const { formMessageService } = await getContainer();
    const page = await formMessageService.list(
      request.organization!,
      request.params.id,
      request.params.branch,
      limit,
      cursor,
    );

    if (!page) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send(page);
  },
  method: 'GET',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/forms/:id/branches/:branch/messages',
};
