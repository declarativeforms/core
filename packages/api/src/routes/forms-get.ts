import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const FORMS_GET: RouteOptions<any, any, any, any> = {
  handler: async (_request: FastifyRequest, reply: FastifyReply) => {
    const { managedFormService } = await getContainer();

    reply.status(200).send(await managedFormService.list());
  },
  method: 'GET',
  url: '/api/v1/forms',
};
