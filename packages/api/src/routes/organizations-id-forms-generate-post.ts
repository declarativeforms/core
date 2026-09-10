import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

const MAX_PROMPT_CHARS = 4000;

export const ORGANIZATIONS_ID_FORMS_GENERATE_POST: RouteOptions<
  any,
  any,
  any,
  any
> = {
  config: {
    rateLimit: {
      keyGenerator: (request: FastifyRequest): string =>
        request.headers.authorization || request.ip,
      max: 20,
      timeWindow: '1 hour',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Body: { prompt?: unknown };
      Params: { organizationId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { formMessageService } = await getContainer();

    const prompt =
      request.body && typeof request.body.prompt === 'string'
        ? request.body.prompt
        : '';

    if (!prompt.trim() || prompt.length > MAX_PROMPT_CHARS) {
      reply.status(400).send();

      return;
    }

    const messages = await formMessageService.generate(
      request.organization!.id,
      request.email!,
      prompt,
    );

    if (messages === 'invalid') {
      reply.status(422).send();

      return;
    }

    if (messages === 'rate_limited') {
      reply.status(429).send();

      return;
    }

    if (messages === 'unavailable') {
      reply.status(503).send();

      return;
    }

    reply.status(200).send(messages);
  },
  method: 'POST',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/forms/generate',
};
