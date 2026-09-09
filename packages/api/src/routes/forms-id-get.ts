import type { IDeclarativeForm } from '@declarativeforms/engine';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const FORMS_ID_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { branch?: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { formService } = await getContainer();

    const branch =
      typeof request.query.branch === 'string'
        ? request.query.branch
        : undefined;

    const form: IDeclarativeForm | null = await formService.findById(
      request.params.id,
      branch,
    );

    if (!form) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send(form);
  },
  method: 'GET',
  url: '/api/v1/forms/:id',
};
