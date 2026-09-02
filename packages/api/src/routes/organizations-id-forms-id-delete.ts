import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

export const ORGANIZATIONS_ID_FORMS_ID_DELETE: RouteOptions<
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
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { internalFormService, organizationService } = await getContainer();

    organizationService.assertAdmin(request.organization!, request.email!);

    const form = await internalFormService.remove(
      request.organization!.id,
      request.params.id,
    );

    if (!form) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send();
  },
  method: 'DELETE',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/forms/:id',
};
