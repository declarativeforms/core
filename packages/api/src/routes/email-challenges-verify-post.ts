import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import jwt from 'jsonwebtoken';
import { getContainer } from '../core';
import { enforceRateLimit } from '../middleware';

export const EMAIL_CHALLENGES_VERIFY_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: {
        email_address: string;
        field_id: string;
        form_id: string;
        request_id: string;
        secret: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const body = request.body;
    if (
      !body ||
      typeof body.email_address !== 'string' ||
      typeof body.field_id !== 'string' ||
      typeof body.form_id !== 'string' ||
      typeof body.request_id !== 'string' ||
      typeof body.secret !== 'string'
    ) {
      reply.status(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'The verification request is incomplete.',
        },
      });
      return;
    }

    if (
      !enforceRateLimit(
        request,
        reply,
        `email-verify:${body.request_id}`,
        6,
        10 * 60_000,
      )
    ) {
      return;
    }

    const { emailVerificationRepository, emailVerificationService } =
      await getContainer();

    const emailVerification = await emailVerificationRepository.find(
      body.request_id,
    );

    if (
      !emailVerification ||
      emailVerification.email !== body.email_address.trim().toLowerCase() ||
      emailVerification.form_id !== body.form_id ||
      emailVerification.field_id !== body.field_id
    ) {
      reply.status(422).send({
        error: {
          code: 'EMAIL_VERIFICATION_FAILED',
          message: 'The verification request or code is invalid.',
        },
      });

      return;
    }

    const emailAddress = await emailVerificationService.verify(
      body.request_id,
      emailVerification.salt,
      body.secret,
    );

    if (!emailAddress) {
      reply.status(422).send({
        error: {
          code: 'EMAIL_VERIFICATION_FAILED',
          message: 'The verification request or code is invalid.',
        },
      });

      return;
    }

    return reply
      .header('Cache-Control', 'no-store')
      .status(200)
      .send({
        token: jwt.sign(
          {
            sub: emailAddress,
            field_id: body.field_id,
            form_id: body.form_id,
          },
          process.env.AUTH_JWT_SECRET || '',
          { expiresIn: '10m' },
        ),
      });
  },
  method: 'POST',
  url: '/api/v1/email-challenges/verify',
};
