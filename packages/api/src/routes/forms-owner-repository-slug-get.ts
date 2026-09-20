import type { IDeclarativeForm } from '@declarativeforms/engine';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const FORMS_OWNER_REPOSITORY_SLUG_GET: RouteOptions<any, any, any, any> =
  {
    handler: async (
      request: FastifyRequest<{
        Params: { owner: string; repository: string; '*': string };
        Querystring: { branch?: string };
      }>,
      reply: FastifyReply,
    ): Promise<void> => {
      const { formService } = await getContainer();

      const form: IDeclarativeForm | null = await formService.findBySlug(
        `forms/${request.params.owner}/${request.params.repository}/${request.params['*']}`,
        request.query.branch,
      );

      if (!form) {
        reply.status(404).send();

        return;
      }

      reply.status(200).send(form);
    },
    method: 'GET',
    schema: {
      params: {
        properties: { '*': { minLength: 1, type: 'string' } },
        required: ['*'],
        type: 'object',
      },
      querystring: {
        properties: { branch: { type: 'string' } },
        type: 'object',
      },
    },
    url: '/api/v1/forms/:owner/:repository/*',
  };
