import type { IDeclarativeForm } from '@declarativeforms/types';
import { findFormBySlug } from '../core';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';

export const FORMS_SLUG_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: Record<string, string>;
      Params: { owner: string; repository: string; '*': string };
      Querystring: { connection_id?: string };
    }>,
    reply: FastifyReply,
  ) => {
    const connectionId = request.query.connection_id;
    const { owner, repository } = request.params;
    const file = request.params['*'];

    if (!file) {
      return reply.status(400).send();
    }

    const slug = `forms/${owner}/${repository}/${file}`;

    const form: IDeclarativeForm | null = await findFormBySlug(
      slug,
      connectionId,
    );

    if (!form) {
      return reply.status(connectionId ? 404 : 403).send();
    }

    reply.status(200).send(form);
  },
  method: 'GET',
  url: '/api/v1/forms/:owner/:repository/*',
  schema: {
    tags: ['forms'],
    summary: 'Get a form by slug',
    params: {
      type: 'object',
      required: ['owner', 'repository'],
      properties: {
        owner: { type: 'string' },
        repository: { type: 'string' },
      },
    },
    querystring: {
      type: 'object',
      properties: {
        connection_id: { type: 'string' },
      },
    },
    response: {
      200: {
        type: 'object',
        additionalProperties: true,
      },
      400: { type: 'null' },
      403: { type: 'null' },
      404: { type: 'null' },
    },
  },
};
