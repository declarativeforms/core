import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

export const ORGANIZATIONS_ID_FORMS_ID_PATCH: RouteOptions<any, any, any, any> =
  {
    config: {
      rateLimit: {
        max: 120,
        timeWindow: '1 hour',
      },
    },
    handler: async (
      request: FastifyRequest<{
        Body: { name?: unknown };
        Params: { id: string };
      }>,
      reply: FastifyReply,
    ) => {
      const name =
        request.body && typeof request.body.name === 'string'
          ? request.body.name.trim()
          : '';

      if (!name || name.length > 120) {
        reply.status(400).send();

        return;
      }

      const { internalFormService } = await getContainer();
      const summary = await internalFormService.rename(
        request.organization!.id,
        request.email!,
        request.params.id,
        name,
      );

      if (!summary) {
        reply.status(404).send();

        return;
      }

      reply.status(200).send(summary);
    },
    method: 'PATCH',
    preHandler: [authenticate, authorizeOrganization],
    url: '/api/v1/organizations/:organizationId/forms/:id',
  };
