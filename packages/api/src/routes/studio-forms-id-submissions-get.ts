import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { listStudioFormSubmissions } from '../core';

export const STUDIO_FORMS_ID_SUBMISSIONS_GET: RouteOptions<
  any,
  any,
  any,
  any
> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const submissions = await listStudioFormSubmissions(request.params.id);

    if (!submissions) {
      reply.status(404).send();
      return;
    }

    reply.status(200).send(submissions);
  },
  method: 'GET',
  url: '/api/v1/studio/forms/:id/submissions',
  schema: {
    tags: ['studio'],
    summary: 'List submissions for a studio form',
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
    },
    response: {
      200: {
        type: 'array',
        items: { type: 'object', additionalProperties: true },
      },
      404: { type: 'null' },
    },
  },
};
