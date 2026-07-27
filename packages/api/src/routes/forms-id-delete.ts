import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { sendNotFound } from './error-response';

export const FORMS_ID_DELETE: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const { managedFormService } = await getContainer();
    const deleted = await managedFormService.delete(request.params.id);

    if (!deleted) {
      sendNotFound(reply);
      return;
    }

    reply.status(204).send();
  },
  method: 'DELETE',
  url: '/api/v1/forms/:id',
};
