import type { FastifyReply, FastifyRequest } from 'fastify';
import { getContainer } from '../core';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { authenticationService } = await getContainer();

  if (!authenticationService.isConfigured()) {
    reply.status(503).send();

    return;
  }

  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send();

    return;
  }

  if (!request.user?.sub) {
    reply.status(401).send();

    return;
  }

  request.email = request.user.sub;
}
