import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { sendInvalidDefinition, sendNotFound } from './error-response';

export const FORMS_ID_PUT: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: unknown;
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { managedFormService } = await getContainer();

    try {
      const form = await managedFormService.update(
        request.params.id,
        request.body,
      );

      if (!form) {
        sendNotFound(reply);
        return;
      }

      reply.status(200).send(form);
    } catch (error) {
      if (!sendInvalidDefinition(reply, error)) {
        throw error;
      }
    }
  },
  method: 'PUT',
  url: '/api/v1/forms/:id',
};
