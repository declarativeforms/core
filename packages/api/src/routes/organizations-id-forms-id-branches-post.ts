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
      Params: { organizationId: string; id: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { internalFormService } = await getContainer();

    const name =
      request.body && typeof request.body.name === 'string'
        ? request.body.name
        : '';
    const from =
      request.body && typeof request.body.from === 'string'
        ? request.body.from
        : 'main';

    if (
      !name ||
      (request.body?.from !== undefined &&
        typeof request.body.from !== 'string')
    ) {
      reply.status(400).send();

      return;
    }

    const created = await internalFormService.createBranch(
      request.organization!.id,
      request.email!,
      request.params.id,
      name,
      from,
    );

    if (!created) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send();
  },
  method: 'POST',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/forms/:id/branches',
};
