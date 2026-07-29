import type { IDeclarativeForm } from '@declarativeforms/core';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import {
  sendFormSourceError,
  sendInvalidDefinition,
  sendInvalidYaml,
} from './error-response';
import { enforceRateLimit } from '../middleware';

export const FORMS_SLUG_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: Record<string, string>;
      Params: { owner: string; repository: string; '*': string };
      Querystring: { ref?: string };
    }>,
    reply: FastifyReply,
  ) => {
    const file = request.params['*'];

    if (!enforceRateLimit(request, reply, 'public-github-form', 30, 60_000)) {
      return;
    }

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

    try {
      const form: IDeclarativeForm = await formService.findBySource({
        owner: request.params.owner,
        repository: request.params.repository,
        path: file,
        ...(request.query.ref ? { ref: request.query.ref } : {}),
      });

      reply.status(200).send(form);
    } catch (error) {
      if (
        !sendInvalidDefinition(reply, error) &&
        !sendInvalidYaml(reply, error) &&
        !sendFormSourceError(reply, error)
      ) {
        throw error;
      }
    }
  },
  method: 'GET',
  url: '/api/v1/forms/:owner/:repository/*',
};
