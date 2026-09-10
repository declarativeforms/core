import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

const MAX_PROMPT_CHARS = 4000;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export const ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_MESSAGES_POST: RouteOptions<
  any,
  any,
  any,
  any
> = {
  config: {
    rateLimit: {
      keyGenerator: (request: FastifyRequest): string =>
        request.headers.authorization || request.ip,
      max: 60,
      timeWindow: '1 hour',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Body: { content?: unknown; idempotency_key?: unknown };
      Params: { organizationId: string; id: string; branch: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { formMessageService } = await getContainer();

    const content =
      request.body && typeof request.body.content === 'string'
        ? request.body.content
        : '';

    if (
      !content.trim() ||
      content.length > MAX_PROMPT_CHARS ||
      (request.body?.idempotency_key !== undefined &&
        (typeof request.body.idempotency_key !== 'string' ||
          !IDEMPOTENCY_KEY_PATTERN.test(request.body.idempotency_key)))
    ) {
      reply.status(400).send();

      return;
    }

    const idempotencyKey =
      request.body && typeof request.body.idempotency_key === 'string'
        ? request.body.idempotency_key
        : null;

    const messages = await formMessageService.send(
      request.organization!.id,
      request.email!,
      request.params.id,
      request.params.branch,
      content,
      idempotencyKey,
    );

    if (messages === null) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send(messages);
  },
  method: 'POST',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/forms/:id/branches/:branch/messages',
};
