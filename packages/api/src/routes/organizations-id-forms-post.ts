import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

export const ORGANIZATIONS_ID_FORMS_POST: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 20,
      timeWindow: '1 hour',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Body: unknown;
      Params: { organizationId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { internalFormService } = await getContainer();

    if (
      request.body === undefined ||
      request.body === null ||
      (typeof request.body !== 'string' &&
        (typeof request.body !== 'object' || Array.isArray(request.body)))
    ) {
      reply.status(400).send();

      return;
    }

    const form = await internalFormService.create(
      request.organization!.id,
      request.email!,
      request.body,
      null,
    );

    if (Array.isArray(form)) {
      reply.status(422).send();

      return;
    }

    reply.status(200).send({
      branch: form.branch,
      id: form.form_id,
      organization_id: form.organization_id,
      revision: form.revision,
    });
  },
  method: 'POST',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/forms',
};
