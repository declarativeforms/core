import type { IDeclarativeForm } from '@declarativeforms/core';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { sendInvalidDefinition, sendNotFound } from './error-response';

export const FORMS_ID_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { formService } = await getContainer();

    try {
      const form: IDeclarativeForm | null = await formService.findById(
        request.params.id,
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
  method: 'GET',
  url: '/api/v1/forms/:id',
};
