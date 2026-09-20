import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const FORMS_ID_EMAIL_CHALLENGES_POST: RouteOptions<any, any, any, any> =
  {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '10 minutes',
      },
    },
    handler: async (
      request: FastifyRequest<{
        Body: { email_address: string; field_id: string };
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

      const challenge = await emailVerificationService.requestChallenge(
        request.params.id,
        request.body.field_id,
        request.body.email_address,
      );

      if (!challenge) {
        reply.status(503).send();

        return;
      }

      reply.status(200).send({
        challenge,
        resend_after_seconds: 60,
      });
    },
    method: 'POST',
    schema: {
      body: {
        properties: {
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
        required: ['email_address', 'field_id'],
        type: 'object',
      },
    },
    url: '/api/v1/forms/:id/email-challenges',
  };
