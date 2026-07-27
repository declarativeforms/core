import type { FastifyReply, FastifyRequest } from 'fastify';
import { timingSafeEqual } from 'node:crypto';

export async function requireApiKey(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const expected = process.env.API_KEY;
  const supplied =
    request.headers.authorization?.match(/^Bearer (.+)$/i)?.[1] ?? null;

  if (!expected || !supplied || !tokensMatch(expected, supplied)) {
    reply.status(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'A valid management API key is required.',
      },
    });
  }
}

function tokensMatch(expected: string, supplied: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);

  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}
