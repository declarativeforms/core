import type { IDeclarativeForm } from '@declarativeforms/types';
import { getContainer } from '../core';
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

    const { formService } = await getContainer();
    const form: IDeclarativeForm | null = await formService.findBySlug(
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
};
