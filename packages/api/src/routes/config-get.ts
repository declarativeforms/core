import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';

export const CONFIG_GET: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 60,
      timeWindow: '1 minute',
    },
  },
  handler: async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.status(200).send({
      form_base_url: (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, ''),
    });
  },
  method: 'GET',
  url: '/api/v1/config',
};
