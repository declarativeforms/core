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
        Body: { email_address?: unknown; field_id?: unknown };
        Params: { id: string };
      }>,
      reply: FastifyReply,
    ) => {
      reply.header('Cache-Control', 'no-store');

      const { emailVerificationService } = await getContainer();

      if (!emailVerificationService.isConfigured()) {
        reply.status(503).send();

        return;
      }

      if (
        typeof request.body?.email_address !== 'string' ||
        typeof request.body?.field_id !== 'string' ||
        !/^[A-Za-z_][A-Za-z0-9_]{0,127}$/.test(request.body.field_id) ||
        request.body.email_address.length > 320 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.body.email_address.trim())
      ) {
        reply.status(400).send();

        return;
      }

      const challenge = await emailVerificationService.request(
        request.params.id,
        request.body.field_id,
        request.body.email_address,
      );

      if (!challenge) {
        reply.status(502).send();

        return;
      }

      reply.status(200).send({
        challenge,
        resend_after_seconds: 60,
      });
    },
    method: 'POST',
    url: '/api/v1/forms/:id/email-challenges',
  };
