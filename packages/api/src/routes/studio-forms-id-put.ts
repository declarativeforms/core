import type { IDeclarativeForm } from '@declarativeforms/types';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const STUDIO_FORMS_ID_PUT: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: IDeclarativeForm;
    }>,
    reply: FastifyReply,
  ) => {
    const { studioFormService } = await getContainer();

    const form = await studioFormService.update(
      request.params.id,
      request.body,
    );

    if (!form) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send(form);
  },
  method: 'PUT',
  url: '/api/v1/studio/forms/:id',
};
