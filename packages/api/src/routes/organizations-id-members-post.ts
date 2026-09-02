import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

export const ORGANIZATIONS_ID_MEMBERS_POST: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 60,
      timeWindow: '1 hour',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Body: { email?: unknown; role?: unknown };
    }>,
    reply: FastifyReply,
  ) => {
    const email =
      request.body && typeof request.body.email === 'string'
        ? request.body.email.trim().toLowerCase()
        : '';

    if (!email || !email.includes('@')) {
      reply.status(400).send();

      return;
    }

    const role =
      request.body && request.body.role === 'admin' ? 'admin' : 'member';

    const { organizationService } = await getContainer();

    reply
      .status(200)
      .send(
        await organizationService.addMember(
          request.organization!,
          email,
          role,
          request.email!,
        ),
      );
  },
  method: 'POST',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/members',
};
