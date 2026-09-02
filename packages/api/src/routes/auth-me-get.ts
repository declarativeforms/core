import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';

export const AUTH_ME_GET: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 60,
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

    reply.status(200).send({
      email,
      organizations: await organizationService.listByMember(email),
      provider: request.user.provider,
    });
  },
  method: 'GET',
  preHandler: authenticate,
  url: '/api/v1/auth/me',
};
