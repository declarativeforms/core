import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Resend } from 'resend';
import { getContainer } from '../core';

const EMAIL_VERIFICATION_OTP_TEMPLATE = readFileSync(
  join(
    __dirname,
    '..',
    'core',
    'services',
    'templates',
    'email-verification-otp.html',
  ),
  'utf-8',
);

export const EMAIL_CHALLENGES_SEND_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { email_address: string; field_id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { emailVerificationService } = await getContainer();

    const result = await emailVerificationService.create(
      request.body.email_address,
      request.body.field_id,
      true,
    );

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: `Declarative Forms <${process.env.RESEND_FROM_EMAIL || 'noreply@example.com'}>`,
      html: EMAIL_VERIFICATION_OTP_TEMPLATE.replace('{{code}}', result.token),
      subject: 'Your Declarative Forms verification code',
      to: request.body.email_address,
    });

    return reply.status(200).send({
      request_id: result.requestId,
    });
  },
  method: 'POST',
  url: '/api/v1/email-challenges/send',
};
