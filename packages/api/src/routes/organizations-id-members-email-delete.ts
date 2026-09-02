import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

export const ORGANIZATIONS_ID_MEMBERS_EMAIL_DELETE: RouteOptions<
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
      Params: { email: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { organizationService } = await getContainer();

    reply
      .status(200)
      .send(
        await organizationService.removeMember(
          request.organization!,
          decodeURIComponent(request.params.email).toLowerCase(),
          request.email!,
        ),
      );
  },
  method: 'DELETE',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/members/:email',
};
