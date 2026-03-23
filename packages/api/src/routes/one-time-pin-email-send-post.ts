import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { createOneTimePinRequest } from '../core';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ONE_TIME_PIN_EMAIL_SEND_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { email: string; field_id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const email = (request.body.email || '').trim().toLowerCase();
    const fieldId = (request.body.field_id || '').trim();

    if (!email || !EMAIL_REGEX.test(email)) {
      return reply.status(400).send({ error: 'Invalid email address' });
    }

    if (!fieldId) {
      return reply.status(400).send({ error: 'field_id is required' });
    }

    const result = await createOneTimePinRequest(email, fieldId);

    if (!result) {
      return reply.status(429).send({
        error: 'Resend cooldown not elapsed',
      });
    }

    reply.status(200).send({
      request_id: result.requestId,
      resend_after_seconds: result.resendAfterSeconds,
    });
  },
  method: 'POST',
  url: '/api/v1/one-time-pin/email/send',
  schema: {
    tags: ['one-time-pin'],
    summary: 'Send a one-time PIN to an email address',
    body: {
      type: 'object',
      required: ['email', 'field_id'],
      properties: {
        email: { type: 'string' },
        field_id: { type: 'string' },
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
