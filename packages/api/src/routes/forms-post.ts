import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { sendInvalidDefinition } from './error-response';

export const FORMS_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{ Body: unknown }>,
    reply: FastifyReply,
  ) => {
    const { managedFormService } = await getContainer();

    try {
      const form = await managedFormService.create(request.body);

      reply.status(201).send(form);
    } catch (error) {
      if (!sendInvalidDefinition(reply, error)) {
        throw error;
      }
    }
  },
  method: 'POST',
  url: '/api/v1/forms',
};
