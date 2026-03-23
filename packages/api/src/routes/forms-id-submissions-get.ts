import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { listFormSubmissions } from '../core';

export const FORMS_ID_SUBMISSIONS_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      reply.status(401).send();

      return;
    }

    const token = authorizationHeader.split(' ')[1];
    const submissions = await listFormSubmissions(request.params.id, token);

    if (!submissions) {
      reply.status(403).send();
      return;
    }

    reply.status(200).send(submissions);
  },
  method: 'GET',
  url: '/api/v1/forms/:id/submissions',
  schema: {
    tags: ['forms'],
    summary: 'List submissions for a form',
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
    },
    security: [
      {
        apiKey: [],
      },
    ],
    response: {
      200: {
        type: 'array',
        items: { type: 'object' },
      },
      401: { type: 'null' },
      403: { type: 'null' },
    },
  },
};
