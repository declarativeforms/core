import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import jwt from 'jsonwebtoken';

export const AUTH_DEMO_POST: RouteOptions<any, any, any, any> = {
  handler: async (_request: FastifyRequest, reply: FastifyReply) => {
    const token = jwt.sign(
      {
        sub: 'demo@example.com',
        username: 'demo@example.com',
      },
      process.env.AUTH_JWT_SECRET as string,
      { expiresIn: '7d' },
    );

    reply.status(200).send({
      token,
      user: 'demo@example.com',
    });
  },
  method: 'POST',
  url: '/api/v1/auth/demo',
};
