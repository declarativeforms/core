import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

export const ORGANIZATIONS_ID_FORMS_ID_BRANCHES_NAME_DELETE: RouteOptions<
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
      Params: { organizationId: string; id: string; branch: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { formMessageService, internalFormService } = await getContainer();
    const deleted = await internalFormService.deleteBranch(
      request.organization!.id,
      request.params.id,
      request.params.branch,
    );

    if (!deleted) {
      reply.status(404).send();

      return;
    }

    await formMessageService.deleteBranchHistory(
      request.params.id,
      request.params.branch,
    );

    reply.status(200).send();
  },
  method: 'DELETE',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/forms/:id/branches/:branch',
};
