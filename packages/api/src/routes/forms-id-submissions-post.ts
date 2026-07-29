import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import {
  createCapabilityToken,
  getContainer,
  SubmissionValidationError,
  verifyCapabilityToken,
} from '../core';
import { enforceRateLimit } from '../middleware';

export const FORMS_ID_SUBMISSIONS_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: Record<string, any>;
      Params: { id: string };
      Querystring: { id?: string; partial?: string; resume_token?: string };
    }>,
    reply: FastifyReply,
  ) => {
    if (
      !enforceRateLimit(request, reply, 'submission-ip', 120, 60_000) ||
      !enforceRateLimit(
        request,
        reply,
        `submission:${request.params.id}`,
        60,
        60_000,
      )
    ) {
      return;
    }

    if (
      !request.body ||
      typeof request.body !== 'object' ||
      Array.isArray(request.body)
    ) {
      reply.status(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'The submission body must be an object.',
        },
      });
      return;
    }

    if (request.query.id) {
      const capability = request.query.resume_token
        ? verifyCapabilityToken(
            request.query.resume_token,
            'resume',
            request.params.id,
          )
        : null;
      if (!capability || capability.sub !== request.query.id) {
        reply.status(401).send({
          error: {
            code: 'INVALID_RESUME_TOKEN',
            message: 'A valid resume token is required to update a submission.',
          },
        });
        return;
      }
    }

    const { submissionService } = await getContainer();

    let submission;
    try {
      submission = await submissionService.createOrUpdate(
        request.params.id,
        request.body,
        request.query.partial === 'true',
        {
          ipAddress: request.ip,
          userAgent: String(request.headers['user-agent'] || '').slice(0, 500),
        },
        request.query.id,
      );
    } catch (error) {
      if (error instanceof SubmissionValidationError) {
        reply.status(422).send({
          error: {
            code: 'INVALID_SUBMISSION',
            details: error.details,
            message: error.message,
          },
        });
        return;
      }
      throw error;
    }

    if (!submission) {
      reply.status(422).send({
        error: {
          code: 'SUBMISSION_REJECTED',
          message: 'The submission could not be accepted.',
        },
      });

      return;
    }

    reply
      .header('Cache-Control', 'no-store')
      .status(200)
      .send({
        data: submission.data,
        deliveries: submission.deliveries?.map(
          ({ error: _error, ...delivery }) => delivery,
        ),
        form_id: submission.form_id,
        id: submission.id,
        resume_token: createCapabilityToken(
          'resume',
          submission.id,
          submission.form_id,
          '7d',
        ),
        status: submission.status,
        updated_at: submission.updated_at,
      });
  },
  method: 'POST',
  url: '/api/v1/forms/:id/submissions',
};
