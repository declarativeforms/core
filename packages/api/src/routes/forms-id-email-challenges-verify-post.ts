import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const FORMS_ID_EMAIL_CHALLENGES_VERIFY_POST: RouteOptions<
  any,
  any,
  any,
  any
> = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: '10 minutes',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Body: {
        challenge: string;
        code: string;
        email_address: string;
        field_id: string;
      };
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { emailVerificationService } = await getContainer();

    reply.header('Cache-Control', 'no-store');

    if (!emailVerificationService.isConfigured()) {
      reply.status(503).send();

      return;
    }

    const token = emailVerificationService.verify(
      request.params.id,
      request.body.field_id,
      request.body.email_address,
      request.body.challenge,
      request.body.code,
    );

    if (!token) {
      reply.status(422).send();

      return;
    }

    reply.status(200).send({ token });
  },
  method: 'POST',
  schema: {
    body: {
      properties: {
        challenge: { minLength: 1, type: 'string' },
        code: { pattern: '^\\d{6}$', type: 'string' },
        email_address: {
          maxLength: 320,
          pattern: '^\\s*[^\\s@]+@[^\\s@]+\\.[^\\s@]+\\s*$',
          type: 'string',
        },
        field_id: {
          pattern: '^[A-Za-z_][A-Za-z0-9_]{0,127}$',
          type: 'string',
        },
      },
      required: ['challenge', 'code', 'email_address', 'field_id'],
      type: 'object',
    },
  },
  url: '/api/v1/forms/:id/email-challenges/verify',
};
