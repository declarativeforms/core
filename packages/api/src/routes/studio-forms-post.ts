import type { IDeclarativeForm } from '@declarativeforms/types';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const STUDIO_FORMS_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: IDeclarativeForm;
    }>,
    reply: FastifyReply,
  ) => {
    const { studioFormService } = await getContainer();
    const form = await studioFormService.create(request.body);
    reply.status(201).send(form);
  },
  method: 'POST',
  url: '/api/v1/studio/forms',
};
