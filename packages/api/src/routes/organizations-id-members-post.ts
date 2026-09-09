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
      Params: { organizationId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { organizationService } = await getContainer();

    const email =
      request.body && typeof request.body.email === 'string'
        ? request.body.email.trim().toLowerCase()
        : '';

    const role = request.body?.role;

    if (
      !email ||
      !email.includes('@') ||
      (role !== undefined && role !== 'admin' && role !== 'member')
    ) {
      reply.status(400).send();

      return;
    }

    reply
      .status(200)
      .send(
        await organizationService.addMember(
          request.organization!,
          email,
          role ?? 'member',
          request.email!,
        ),
      );
  },
  method: 'POST',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/members',
};
