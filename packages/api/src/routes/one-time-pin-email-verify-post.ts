import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { verifyOneTimePinCode } from '../core';

const ONE_TIME_PIN_REGEX = /^\d{6}$/;

export const ONE_TIME_PIN_EMAIL_VERIFY_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: {
        email: string;
        request_id: string;
        one_time_pin: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const email = (request.body.email || '').trim().toLowerCase();
    const requestId = (request.body.request_id || '').trim();
    const oneTimePin = (request.body.one_time_pin || '').trim();

    if (!email || !requestId) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    if (!ONE_TIME_PIN_REGEX.test(oneTimePin)) {
      return reply.status(400).send({ error: 'OneTimePin must be a 6-digit string' });
    }

    const verificationToken = await verifyOneTimePinCode(requestId, email, oneTimePin);

    if (!verificationToken) {
      return reply.status(422).send({ error: 'Invalid verification code' });
    }

    reply.status(200).send({ verification_token: verificationToken });
  },
  method: 'POST',
  url: '/api/v1/one-time-pin/email/verify',
  schema: {
    tags: ['one-time-pin'],
    body: {
      type: 'object',
      required: ['email', 'request_id', 'one_time_pin'],
      properties: {
        email: { type: 'string' },
        request_id: { type: 'string' },
        one_time_pin: { type: 'string' },
      },
    },
  },
};
