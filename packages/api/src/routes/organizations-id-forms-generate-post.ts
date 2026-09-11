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
      Body: { branch?: unknown; form_id?: unknown; prompt?: unknown };
      Params: { organizationId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { formMessageService } = await getContainer();

    const prompt =
      request.body && typeof request.body.prompt === 'string'
        ? request.body.prompt
        : '';

    if (
      !prompt.trim() ||
      prompt.length > MAX_PROMPT_CHARS ||
      (request.body?.form_id !== undefined &&
        (typeof request.body.form_id !== 'string' || !request.body.form_id)) ||
      (request.body?.branch !== undefined &&
        (typeof request.body.branch !== 'string' || !request.body.branch)) ||
      (request.body?.branch !== undefined && request.body.form_id === undefined)
    ) {
      reply.status(400).send();

      return;
    }

    const messages = await formMessageService.generate(
      request.organization!.id,
      request.email!,
      typeof request.body?.form_id === 'string' ? request.body.form_id : null,
      typeof request.body?.branch === 'string' ? request.body.branch : 'main',
      prompt,
    );

    if (messages === null) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send(messages);
  },
  method: 'POST',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/forms/generate',
};
