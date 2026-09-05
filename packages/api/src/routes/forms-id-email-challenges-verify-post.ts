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
        challenge?: unknown;
        code?: unknown;
        email_address?: unknown;
        field_id?: unknown;
      };
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
      typeof request.body?.challenge !== 'string' ||
      typeof request.body?.code !== 'string' ||
      typeof request.body?.email_address !== 'string' ||
      typeof request.body?.field_id !== 'string' ||
      request.body.challenge.length === 0 ||
      !/^\d{6}$/.test(request.body.code) ||
      !/^[A-Za-z_][A-Za-z0-9_]{0,127}$/.test(request.body.field_id) ||
      request.body.email_address.length > 320 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.body.email_address.trim())
    ) {
      reply.status(400).send();

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
  url: '/api/v1/forms/:id/email-challenges/verify',
};
