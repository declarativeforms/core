import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { createOrUpdateSubmission } from '../core';

export const FORMS_ID_SUBMISSIONS_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: Record<string, any>;
      Params: { id: string };
      Querystring: { id?: string; partial?: string };
    }>,
    reply: FastifyReply,
  ) => {
    const submission = await createOrUpdateSubmission({
      data: request.body,
      formId: request.params.id,
      isPartial: request.query.partial === 'true',
      metadata: {
        ipAddress: String(request.headers['do-connecting-ip'] || ''),
        userAgent: String(request.headers['user-agent'] || ''),
      },
      submissionId: request.query.id,
    });

    if (!submission) {
      reply.status(422).send();
      return;
    }

    reply.status(200).send(submission);
  },
  method: 'POST',
  url: '/api/v1/forms/:id/submissions',
  schema: {
    tags: ['forms'],
    summary: 'Create or update a form submission',
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
    },
    querystring: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        partial: { type: 'string', enum: ['true', 'false'] },
      },
    },
    body: {
      type: 'object',
    },
    response: {
      200: {
        type: 'object',
      },
      422: { type: 'null' },
    },
  },
};
