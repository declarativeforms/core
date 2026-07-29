import type { IDeclarativeForm } from '@declarativeforms/core';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import {
  sendFormSourceError,
  sendInvalidDefinition,
  sendInvalidYaml,
  sendNotFound,
} from './error-response';
import { enforceRateLimit } from '../middleware';

export const FORMS_ID_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    if (
      !enforceRateLimit(
        request,
        reply,
        `form-read:${request.params.id}`,
        120,
        60_000,
      )
    ) {
      return;
    }

    const { formService } = await getContainer();

    try {
      const form: IDeclarativeForm | null =
        await formService.findForRenderingById(request.params.id);

      if (!form) {
        sendNotFound(reply);
        return;
      }

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
  url: '/api/v1/forms/:id',
};
