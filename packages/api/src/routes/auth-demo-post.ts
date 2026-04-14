import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import jwt from 'jsonwebtoken';

const DEMO_USER = {
  github_id: 0,
  login: 'demo',
  name: 'Demo User',
  avatar_url: '',
};

export const AUTH_DEMO_POST: RouteOptions<any, any, any, any> = {
  handler: async (_request: FastifyRequest, reply: FastifyReply) => {
    const secret = process.env.AUTH_JWT_SECRET;

    if (!secret) {
      reply.status(500).send({ error: 'Server configuration error' });
      return;
    }

    const token = jwt.sign(DEMO_USER, secret, { expiresIn: '7d' });

    reply.status(200).send({
      token,
      user: {
        id: DEMO_USER.github_id,
        login: DEMO_USER.login,
        name: DEMO_USER.name,
        avatar_url: DEMO_USER.avatar_url,
      },
    });
  },
  method: 'POST',
  url: '/api/v1/auth/demo',
};
