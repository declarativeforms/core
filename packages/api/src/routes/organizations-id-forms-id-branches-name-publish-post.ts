import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

export const ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_PUBLISH_POST: RouteOptions<
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
      Body: { delete_branch?: unknown };
      Params: { branch: string; id: string };
      Querystring: { target?: string };
    }>,
    reply: FastifyReply,
  ) => {
    const target =
      typeof request.query.target === 'string' ? request.query.target : 'main';

    const { internalFormService } = await getContainer();
    const form = await internalFormService.publish(
      request.organization!.id,
      request.email!,
      request.params.id,
      request.params.branch,
      target,
      !!(request.body && request.body.delete_branch === true),
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
  url: '/api/v1/organizations/:organizationId/forms/:id/branches/:branch/publish',
};
