import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

export const ORGANIZATIONS_ID_GET: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 300,
      timeWindow: '1 minute',
    },
  },
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    reply.status(200).send(request.organization);
  },
  method: 'GET',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId',
};
