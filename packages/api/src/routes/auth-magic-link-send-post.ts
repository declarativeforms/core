import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { createStudioMagicLinkRequest } from '../core';

export const AUTH_MAGIC_LINK_SEND_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { email: string; redirect_url: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { email, redirect_url } = request.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      reply.status(400).send({ error: 'Invalid email address' });
      return;
    }

    if (!redirect_url) {
      reply.status(400).send({ error: 'redirect_url is required' });
      return;
    }

    const result = await createStudioMagicLinkRequest(email, redirect_url);

    if (!result) {
      reply.status(429).send({ error: 'Please wait before requesting another link' });
      return;
    }

    reply.status(200).send({
      request_id: result.requestId,
      resend_after_seconds: result.resendAfterSeconds,
    });
  },
  method: 'POST',
  url: '/api/v1/auth/magic-link/send',
  schema: {
    tags: ['auth'],
    summary: 'Send a magic link for Studio authentication',
    body: {
      type: 'object',
      required: ['email', 'redirect_url'],
      properties: {
        email: { type: 'string' },
        redirect_url: { type: 'string' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          request_id: { type: 'string' },
          resend_after_seconds: { type: 'number' },
        },
      },
      400: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
      429: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
};
