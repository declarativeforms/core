import type { IDeclarativeForm } from '@declarativeforms/types';
import { getContainer } from '../core';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';

export const FORMS_SLUG_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: Record<string, string>;
      Params: { owner: string; repository: string; '*': string };
      Querystring: { access_token?: string };
    }>,
    reply: FastifyReply,
  ) => {
    const accessToken = request.query.access_token;
    const { owner, repository } = request.params;
    const file = request.params['*'];

    if (!file) {
      return reply.status(400).send();
    }

    const slug = `forms/${owner}/${repository}/${file}`;

    const { formService } = await getContainer();
    const form: IDeclarativeForm | null = await formService.findBySlug(
      slug,
      accessToken,
    );

    if (!form) {
      return reply.status(accessToken ? 404 : 403).send();
    }

    reply.status(200).send(form);
  },
  method: 'GET',
  url: '/api/v1/forms/:owner/:repository/*',
};
