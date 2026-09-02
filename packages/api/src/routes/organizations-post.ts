import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';

export const ORGANIZATIONS_POST: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 20,
      timeWindow: '1 hour',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Body: { name?: unknown };
    }>,
    reply: FastifyReply,
  ) => {
    const email = request.email;

    if (!email) {
      reply.status(401).send();

      return;
    }

    const name =
      request.body && typeof request.body.name === 'string'
        ? request.body.name.trim()
        : '';

    if (!name || name.length > 120) {
      reply.status(400).send();

      return;
    }

    const { organizationService } = await getContainer();

    reply.status(200).send(await organizationService.create(name, email, []));
  },
  method: 'POST',
  preHandler: authenticate,
  url: '/api/v1/organizations',
};
