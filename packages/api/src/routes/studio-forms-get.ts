import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const STUDIO_FORMS_GET: RouteOptions<any, any, any, any> = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    const { studioFormService } = await getContainer();

    const forms = await studioFormService.list(request.user?.username ?? '');

    reply.status(200).send(forms);
  },
  method: 'GET',
  url: '/api/v1/studio/forms',
};
