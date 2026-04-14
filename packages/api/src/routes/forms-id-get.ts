import type { IDeclarativeForm } from '@declarativeforms/types';
import { getContainer } from '../core';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';

export const FORMS_ID_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { formService } = await getContainer();
    const form: IDeclarativeForm | null = await formService.findById(
      request.params.id,
    );

    if (!form) {
      return reply.status(404).send();
    }

    reply.status(200).send(form);
  },
  method: 'GET',
  url: '/api/v1/forms/:id',
};
