import type { FastifyReply, FastifyRequest } from 'fastify';
import { resolveAuthUser } from '../core';

export async function requireStudioAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = await resolveAuthUser(request.headers.authorization);

  if (!user) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }
}
