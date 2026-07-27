import type { IDeclarativeForm } from '@declarativeforms/core';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { sendInvalidDefinition } from './error-response';

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
      reply.status(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'A YAML file path is required.',
        },
      });

      return;
    }

    const { formService } = await getContainer();

    const slug = `forms/${request.params.owner}/${request.params.repository}/${file}`;

    try {
      const form: IDeclarativeForm | null = await formService.findBySlug(slug);

      if (!form) {
        reply.status(404).send({
          error: {
            code: 'GITHUB_FORM_NOT_FOUND',
            message: 'The public GitHub form could not be loaded.',
          },
        });

        return;
      }

      reply.status(200).send(form);
    } catch (error) {
      if (!sendInvalidDefinition(reply, error)) {
        throw error;
      }
    }
  },
  method: 'GET',
  url: '/api/v1/forms/:owner/:repository/*',
};
