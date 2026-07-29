import type { FastifyReply } from 'fastify';
import { FormYamlParseError } from '@declarativeforms/core';
import {
  FormSourceError,
  InvalidFormDefinitionError,
  InvalidGitHubSourceError,
} from '../core';

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

export function sendInvalidYaml(reply: FastifyReply, error: unknown): boolean {
  if (!(error instanceof FormYamlParseError)) {
    return false;
  }

  reply.status(422).send({
    error: {
      code: 'INVALID_FORM_YAML',
      message: error.message,
      ...(error.line !== undefined && error.column !== undefined
        ? { location: { column: error.column, line: error.line } }
        : {}),
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

export function sendFormSourceError(
  reply: FastifyReply,
  error: unknown,
): boolean {
  if (error instanceof InvalidGitHubSourceError) {
    reply.status(400).send({
      error: {
        code: 'INVALID_GITHUB_SOURCE',
        message: error.message,
      },
    });
    return true;
  }

  if (!(error instanceof FormSourceError)) {
    return false;
  }

  const statusCode =
    error.code === 'GITHUB_SOURCE_NOT_FOUND'
      ? 404
      : error.code === 'GITHUB_AUTH_FAILED'
        ? 403
        : error.code === 'GITHUB_RATE_LIMITED'
          ? 429
          : error.code === 'GITHUB_SOURCE_TOO_LARGE'
            ? 422
            : 503;

  if (error.retryAfter) {
    reply.header('Retry-After', error.retryAfter);
  }
  reply.status(statusCode).send({
    error: {
      code: error.code,
      message: error.message,
    },
  });
  return true;
}
