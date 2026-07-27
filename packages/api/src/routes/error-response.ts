import type { FastifyReply } from 'fastify';
import { InvalidFormDefinitionError } from '../core';

export function sendInvalidDefinition(
  reply: FastifyReply,
  error: unknown,
): boolean {
  if (!(error instanceof InvalidFormDefinitionError)) {
    return false;
  }

  reply.status(422).send({
    error: {
      code: 'INVALID_FORM_DEFINITION',
      details: error.details,
      message: error.message,
    },
  });

  return true;
}

export function sendNotFound(reply: FastifyReply, resource = 'Form'): void {
  reply.status(404).send({
    error: {
      code: 'NOT_FOUND',
      message: `${resource} not found.`,
    },
  });
}
