import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const FORMS_ID_TURNSTILE_VERIFY_POST: RouteOptions<any, any, any, any> =
  {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
    handler: async (
      request: FastifyRequest<{
        Body: { field_id: string; response: string };
        Params: { id: string };
      }>,
      reply: FastifyReply,
    ): Promise<void> => {
      const { formService, turnstileVerificationService } =
        await getContainer();

      reply.header('Cache-Control', 'no-store');

      if (!turnstileVerificationService.isConfigured()) {
        reply.status(503).send();

        return;
      }

      const form = await formService.findById(request.params.id);

      if (
        !form ||
        !(form.sections ?? []).some((section): boolean =>
          (section.fields ?? []).some(
            (field): boolean =>
              field.id === request.body.field_id && field.type === 'turnstile',
          ),
        )
      ) {
        reply.status(404).send();

        return;
      }

      const token = await turnstileVerificationService.verify(
        form.id || '',
        request.body.field_id,
        request.body.response,
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
          field_id: {
            pattern: '^[A-Za-z_][A-Za-z0-9_]{0,127}$',
            type: 'string',
          },
          response: {
            maxLength: 2048,
            minLength: 1,
            type: 'string',
          },
        },
        required: ['field_id', 'response'],
        type: 'object',
      },
    },
    url: '/api/v1/forms/:id/turnstile/verify',
  };
