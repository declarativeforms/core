import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import jwt from 'jsonwebtoken';

const DEMO_USER = {
  username: 'demo@example.com',
};

export const AUTH_DEMO_POST: RouteOptions<any, any, any, any> = {
  handler: async (_request: FastifyRequest, reply: FastifyReply) => {
    const token = jwt.sign(
      {
        sub: DEMO_USER.username,
        username: DEMO_USER.username,
      },
      process.env.AUTH_JWT_SECRET as string,
      { expiresIn: '7d' },
    );

    reply.status(200).send({
      token,
      user: DEMO_USER,
    });
  },
  method: 'POST',
  url: '/api/v1/auth/demo',
};
