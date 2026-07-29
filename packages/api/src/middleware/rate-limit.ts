import type { FastifyReply, FastifyRequest } from 'fastify';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const entries = new Map<string, RateLimitEntry>();

export function enforceRateLimit(
  request: FastifyRequest,
  reply: FastifyReply,
  scope: string,
  limit: number,
  windowMs: number,
  subject = request.ip,
): boolean {
  const now = Date.now();
  const key = `${scope}:${subject}`;
  const current = entries.get(key);
  const entry =
    !current || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current;

  entry.count += 1;
  if (!current && entries.size >= 10_000) {
    const oldestKey = entries.keys().next().value;
    if (typeof oldestKey === 'string') {
      entries.delete(oldestKey);
    }
  }
  entries.set(key, entry);

  if (entries.size > 10_000) {
    for (const [entryKey, value] of entries) {
      if (value.resetAt <= now) {
        entries.delete(entryKey);
      }
    }
  }

  if (entry.count <= limit) {
    return true;
  }

  reply
    .header(
      'Retry-After',
      String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))),
    )
    .status(429)
    .send({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
      },
    });

  return false;
}
