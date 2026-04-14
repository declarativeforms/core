import type { FastifyReply, FastifyRequest } from 'fastify';
import { getContainer, parseAuthorizationHeader } from '../core';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { username: string };
  }
}

export async function requireStudioAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = parseAuthorizationHeader(request.headers.authorization);

  if (!token) {
    reply.status(401).send();

    return;
  }

  const { authService } = await getContainer();

  const user = await authService.verify(token);

  if (!user) {
    reply.status(401).send();

    return;
  }

  request.user = user;
}
