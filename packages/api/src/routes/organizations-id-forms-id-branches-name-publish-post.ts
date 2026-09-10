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
      Params: { organizationId: string; id: string; branch: string };
      Querystring: { target?: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { internalFormService } = await getContainer();

    if (
      (request.body !== undefined &&
        request.body !== null &&
        (typeof request.body !== 'object' ||
          Array.isArray(request.body) ||
          Buffer.isBuffer(request.body))) ||
      (request.body?.delete_branch !== undefined &&
        typeof request.body.delete_branch !== 'boolean') ||
      (request.query.target !== undefined &&
        (typeof request.query.target !== 'string' || !request.query.target))
    ) {
      reply.status(400).send();

      return;
    }

    const target =
      typeof request.query.target === 'string' ? request.query.target : 'main';
    const form = await internalFormService.publish(
      request.organization!.id,
      request.email!,
      request.params.id,
      request.params.branch,
      target,
      request.body?.delete_branch === true,
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
