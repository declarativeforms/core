import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import jwt from 'jsonwebtoken';
import { getContainer } from '../core';

export const EMAIL_CHALLENGES_VERIFY_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: {
        email_address: string;
        request_id: string;
        secret: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const { emailVerificationRepository, emailVerificationService } =
      await getContainer();

    const emailVerification = await emailVerificationRepository.find(
      request.body.request_id,
    );

    if (
      !emailVerification ||
      emailVerification.email !== request.body.email_address
    ) {
      reply.status(422).send();

      return;
    }

    const emailAddress = await emailVerificationService.verify(
      request.body.request_id,
      emailVerification.salt,
      request.body.secret,
    );

    if (!emailAddress) {
      reply.status(422).send();

      return;
    }

    return reply.status(200).send({
      token: jwt.sign(
        {
          sub: emailAddress,
        },
        process.env.AUTH_JWT_SECRET || '',
        { expiresIn: '10m' },
      ),
    });
  },
  method: 'POST',
  url: '/api/v1/email-challenges/verify',
};
