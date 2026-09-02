import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

export const ORGANIZATIONS_ID_FORMS_GENERATE_POST: RouteOptions<
  any,
  any,
  any,
  any
> = {
  config: {
    rateLimit: {
      keyGenerator: (request: FastifyRequest) =>
        request.headers.authorization || request.ip,
      max: 20,
      timeWindow: '1 hour',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Body: { prompt?: unknown };
    }>,
    reply: FastifyReply,
  ) => {
    const prompt =
      request.body && typeof request.body.prompt === 'string'
        ? request.body.prompt
        : '';

    if (!prompt.trim()) {
      reply.status(400).send();

      return;
    }

    const { formMessageService } = await getContainer();

    reply
      .status(200)
      .send(
        await formMessageService.generate(
          request.organization!,
          request.email!,
          prompt,
        ),
      );
  },
  method: 'POST',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/forms/generate',
};
