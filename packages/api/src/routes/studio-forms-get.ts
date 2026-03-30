import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { listStudioForms } from '../core';

export const STUDIO_FORMS_GET: RouteOptions<any, any, any, any> = {
  handler: async (_request: FastifyRequest, reply: FastifyReply) => {
    const forms = await listStudioForms();
    reply.status(200).send(forms);
  },
  method: 'GET',
  url: '/api/v1/studio/forms',
  schema: {
    tags: ['studio'],
    summary: 'List all studio forms',
    response: {
      200: {
        type: 'array',
        items: { type: 'object', additionalProperties: true },
      },
    },
  },
};
