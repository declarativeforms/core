import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer, verifyCapabilityToken } from '../core';
import { enforceRateLimit } from '../middleware';

export const FORMS_ID_SUBMISSIONS_RESUME_GET: RouteOptions<any, any, any, any> =
  {
    handler: async (
      request: FastifyRequest<{
        Params: { id: string };
        Querystring: { token?: string };
      }>,
      reply: FastifyReply,
    ) => {
      if (
        !enforceRateLimit(
          request,
          reply,
          `resume:${request.params.id}`,
          60,
          60_000,
        )
      ) {
        return;
      }

      const capability = request.query.token
        ? verifyCapabilityToken(
            request.query.token,
            'resume',
            request.params.id,
          )
        : null;

      if (!capability) {
        reply.status(401).send({
          error: {
            code: 'INVALID_RESUME_TOKEN',
            message: 'The resume token is missing or invalid.',
          },
        });
        return;
      }

      const { submissionService } = await getContainer();
      const submission = await submissionService.findById(
        request.params.id,
        capability.sub,
      );

      if (!submission) {
        reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Submission not found.',
          },
        });
        return;
      }

      reply.header('Cache-Control', 'no-store').status(200).send({
        data: submission.data,
        id: submission.id,
        status: submission.status,
      });
    },
    method: 'GET',
    url: '/api/v1/forms/:id/submissions/resume',
  };
