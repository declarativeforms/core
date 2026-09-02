import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';

export const ORGANIZATIONS_GET: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 300,
      timeWindow: '1 minute',
    },
  },
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    const email = request.email;

    if (!email) {
      reply.status(401).send();

      return;
    }

    const { organizationService } = await getContainer();

    reply.status(200).send(await organizationService.listByMember(email));
  },
  method: 'GET',
  preHandler: authenticate,
  url: '/api/v1/organizations',
};
