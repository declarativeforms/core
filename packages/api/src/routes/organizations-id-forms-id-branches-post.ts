import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

export const ORGANIZATIONS_ID_FORMS_ID_BRANCHES_POST: RouteOptions<
  any,
  any,
  any,
  any
> = {
  config: {
    rateLimit: {
      max: 60,
      timeWindow: '1 hour',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Body: { from?: unknown; name?: unknown };
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const name =
      request.body && typeof request.body.name === 'string'
        ? request.body.name
        : '';
    const from =
      request.body && typeof request.body.from === 'string'
        ? request.body.from
        : 'main';

    if (!name) {
      reply.status(400).send();

      return;
    }

    const { internalFormService } = await getContainer();
    const form = await internalFormService.createBranch(
      request.organization!,
      request.email!,
      request.params.id,
      name,
      from,
    );

    if (!form) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send({
      branch: form.branch,
      id: form.form_id,
      revision: form.revision,
    });
  },
  method: 'POST',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/forms/:id/branches',
};
