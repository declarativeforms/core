import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { authenticate } from './authenticate';
import { authorizeOrganization } from './authorize-organization';

export const ORGANIZATIONS_ID_FORMS_ID_PUT: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 120,
      timeWindow: '1 hour',
    },
  },
  handler: async (
    request: FastifyRequest<{
      Body: unknown;
      Params: { organizationId: string; id: string };
      Querystring: { branch?: string; expected_revision?: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { internalFormService } = await getContainer();

    if (
      request.body === undefined ||
      request.body === null ||
      (typeof request.body !== 'string' &&
        (typeof request.body !== 'object' || Array.isArray(request.body))) ||
      (request.query.branch !== undefined &&
        (typeof request.query.branch !== 'string' || !request.query.branch)) ||
      (request.query.expected_revision !== undefined &&
        typeof request.query.expected_revision !== 'string')
    ) {
      reply.status(400).send();

      return;
    }

    const branch =
      typeof request.query.branch === 'string'
        ? request.query.branch
        : undefined;

    const expectedRevision =
      typeof request.query.expected_revision === 'string'
        ? Number.parseInt(request.query.expected_revision, 10)
        : null;

    if (expectedRevision !== null && !Number.isInteger(expectedRevision)) {
      reply.status(400).send();

      return;
    }

    const form = await internalFormService.update(
      request.organization!.id,
      request.email!,
      request.params.id,
      branch,
      request.body,
      expectedRevision,
    );

    if (Array.isArray(form)) {
      reply.status(422).send();

      return;
    }

    if (form === false) {
      reply.status(409).send();

      return;
    }

    if (form === null) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send({
      branch: form.branch,
      id: form.form_id,
      organization_id: form.organization_id,
      revision: form.revision,
    });
  },
  method: 'PUT',
  preHandler: [authenticate, authorizeOrganization],
  url: '/api/v1/organizations/:organizationId/forms/:id',
};
