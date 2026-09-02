import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

export const ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_MESSAGES_POST: RouteOptions<
  any,
  any,
  any,
  any
> = {
  config: {
    rateLimit: {
      keyGenerator: (request: FastifyRequest) =>
        request.headers.authorization || request.ip,
      max: 60,
      timeWindow: '1 hour',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Body: { content?: unknown; idempotency_key?: unknown };
      Params: { branch: string; id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const content =
      request.body && typeof request.body.content === 'string'
        ? request.body.content
        : '';

    if (!content.trim()) {
      reply.status(400).send();

      return;
    }

    const idempotencyKey =
      request.body && typeof request.body.idempotency_key === 'string'
        ? request.body.idempotency_key
        : null;

    const { formMessageService } = await getContainer();
    const turn = await formMessageService.send(
      request.organization!,
      request.email!,
      request.params.id,
      request.params.branch,
      content,
      idempotencyKey,
    );

    if (!turn) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send(turn);
  },
  method: 'POST',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/forms/:id/branches/:branch/messages',
};
