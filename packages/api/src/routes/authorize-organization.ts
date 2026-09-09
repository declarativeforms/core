import type { FastifyReply, FastifyRequest } from 'fastify';
import { getContainer } from '../core';

export async function authorizeOrganization(
  request: FastifyRequest<{ Params: { organizationId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const email = request.email;

  if (!email) {
    reply.status(401).send();

    return;
  }

  const { organizationService } = await getContainer();
  const organization = await organizationService.find(
    request.params.organizationId,
  );

  if (!organization || !organizationService.findMember(organization, email)) {
    reply.status(404).send();

    return;
  }

  request.organization = organization;
}
