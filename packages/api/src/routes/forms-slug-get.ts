import type { IDeclarativeForm } from '@declarativeforms/engine';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const FORMS_SLUG_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: Record<string, string>;
      Params: { owner: string; repository: string; '*': string };
    }>,
    reply: FastifyReply,
  ) => {
    const file = request.params['*'];

    if (!file) {
      reply.status(400).send();

      return;
    }

    const { formService } = await getContainer();

    const slug = `forms/${request.params.owner}/${request.params.repository}/${file}`;

    const form: IDeclarativeForm | null = await formService.findBySlug(slug);

    if (!form) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send(form);
  },
  method: 'GET',
  url: '/api/v1/forms/:owner/:repository/*',
};
