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
      const file = request.params['*'];

      if (!file) {
        reply.status(400).send();

        return;
      }

      const slug = `forms/${request.params.owner}/${request.params.repository}/${file}`;
      const branch =
        typeof request.query.branch === 'string'
          ? request.query.branch
          : undefined;

      const form: IDeclarativeForm | null = await formService.findBySlug(
        slug,
        branch,
      );

      if (!form) {
        reply.status(404).send();

        return;
      }

      reply.status(200).send(form);
    },
    method: 'GET',
    url: '/api/v1/forms/:owner/:repository/*',
  };
