import type { IStudioForm } from '@declarativeforms/types';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { findUserByToken, parseAuthorizationHeader, updateStudioFormById } from '../core';

export const STUDIO_FORMS_ID_PUT: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: IStudioForm;
    }>,
    reply: FastifyReply,
  ) => {
    const token = parseAuthorizationHeader(request.headers.authorization);
    const user = token ? await findUserByToken(token) : null;

    const form = await updateStudioFormById(
      request.params.id,
      request.body,
      user?.email ?? null,
    );

    reply.status(200).send(form);
  },
  method: 'PUT',
  url: '/api/v1/studio/forms/:id',
  schema: {
    tags: ['studio'],
    summary: 'Update a studio form',
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
    },
    body: {
      type: 'object',
      additionalProperties: true,
    },
    response: {
      200: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
};
