import type { FastifyReply, FastifyRequest } from 'fastify';
import { findUserByToken, parseAuthorizationHeader } from '../core';

export async function requireStudioAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = parseAuthorizationHeader(request.headers.authorization);

  if (!token) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }

  const user = await findUserByToken(token);

  if (!user) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }
}
