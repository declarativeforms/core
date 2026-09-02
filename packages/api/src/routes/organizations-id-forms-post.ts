import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

export const ORGANIZATIONS_ID_FORMS_POST: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 20,
      timeWindow: '1 hour',
    },
  },
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    const { internalFormService } = await getContainer();
    const form = await internalFormService.create(
      request.organization!,
      request.email!,
      request.body,
    );

    reply.status(200).send({
      branch: form.branch,
      id: form.form_id,
      organization_id: form.organization_id,
      revision: form.revision,
    });
  },
  method: 'POST',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/forms',
};
