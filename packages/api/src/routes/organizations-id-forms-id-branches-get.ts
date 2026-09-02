import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

export const ORGANIZATIONS_ID_FORMS_ID_BRANCHES_GET: RouteOptions<
  any,
  any,
  any,
  any
> = {
  config: {
    rateLimit: {
      max: 300,
      timeWindow: '1 minute',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { internalFormService } = await getContainer();
    const branches = await internalFormService.findBranchNames(
      request.organization!,
      request.params.id,
    );

    if (!branches) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send(branches);
  },
  method: 'GET',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/forms/:id/branches',
};
