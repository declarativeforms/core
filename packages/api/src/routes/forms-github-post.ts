import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { sendInvalidDefinition } from './error-response';

type RegisterGitHubBody = {
  owner?: string;
  repository?: string;
  path?: string;
  ref?: string;
};

export const FORMS_GITHUB_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{ Body: RegisterGitHubBody }>,
    reply: FastifyReply,
  ) => {
    if (!process.env.GITHUB_TOKEN) {
      reply.status(503).send({
        error: {
          code: 'GITHUB_TOKEN_NOT_CONFIGURED',
          message: 'GITHUB_TOKEN is required to register private forms.',
        },
      });
      return;
    }

    const body = request.body;

    if (
      !body ||
      typeof body.owner !== 'string' ||
      typeof body.repository !== 'string' ||
      typeof body.path !== 'string' ||
      (body.ref !== undefined && typeof body.ref !== 'string') ||
      !body.owner.trim() ||
      !body.repository.trim() ||
      !body.path.trim()
    ) {
      reply.status(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'owner, repository, and path are required.',
        },
      });
      return;
    }

    const { formService } = await getContainer();

    try {
      const source = await formService.registerGitHubSource({
        owner: body.owner,
        repository: body.repository,
        path: body.path,
        ref: body.ref,
      });

      if (!source) {
        reply.status(404).send({
          error: {
            code: 'GITHUB_FORM_NOT_FOUND',
            message: 'The GitHub form could not be loaded.',
          },
        });
        return;
      }

      reply.status(201).send(source);
    } catch (error) {
      if (!sendInvalidDefinition(reply, error)) {
        throw error;
      }
    }
  },
  method: 'POST',
  url: '/api/v1/forms/github',
};
