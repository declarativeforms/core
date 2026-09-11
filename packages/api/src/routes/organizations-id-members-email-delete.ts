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
      Params: { organizationId: string; email: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { organizationService } = await getContainer();
    const email = request.params.email.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      reply.status(400).send();

      return;
    }

    const removed = await organizationService.removeMember(
      request.organization!,
      request.email!,
      email,
    );

    if (!removed) {
      reply.status(403).send();

      return;
    }

    reply.status(200).send();
  },
  method: 'DELETE',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/members/:email',
};
