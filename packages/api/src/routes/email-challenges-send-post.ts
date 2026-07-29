import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Resend } from 'resend';
import { getContainer } from '../core';
import { enforceRateLimit } from '../middleware';

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
      Body: { email_address: string; field_id: string; form_id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const body = request.body;
    if (
      !body ||
      typeof body.email_address !== 'string' ||
      typeof body.field_id !== 'string' ||
      typeof body.form_id !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email_address) ||
      !body.field_id ||
      !body.form_id
    ) {
      reply.status(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'form_id, field_id, and a valid email_address are required.',
        },
      });
      return;
    }

    const normalizedEmail = body.email_address.trim().toLowerCase();
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      reply.status(503).send({
        error: {
          code: 'EMAIL_NOT_CONFIGURED',
          message: 'Email verification is not configured on this deployment.',
        },
      });
      return;
    }

    if (
      !enforceRateLimit(request, reply, 'email-send-ip', 5, 10 * 60_000) ||
      !enforceRateLimit(
        request,
        reply,
        'email-send-address',
        3,
        10 * 60_000,
        normalizedEmail,
      )
    ) {
      return;
    }

    const {
      emailVerificationRepository,
      emailVerificationService,
      formService,
    } = await getContainer();
    const form = await formService.findForRenderingById(body.form_id);
    const field = form?.sections
      ?.flatMap((section) => section.fields ?? [])
      .find((candidate) => candidate.id === body.field_id);

    if (field?.type !== 'email' || field.otp !== true) {
      reply.status(404).send({
        error: {
          code: 'EMAIL_CHALLENGE_NOT_AVAILABLE',
          message: 'This form field does not support email verification.',
        },
      });
      return;
    }

    const result = await emailVerificationService.create(
      normalizedEmail,
      body.field_id,
      true,
      body.form_id,
    );

    const resend = new Resend(process.env.RESEND_API_KEY);

    const delivery = await resend.emails.send({
      from: `Declarative Forms <${process.env.RESEND_FROM_EMAIL}>`,
      html: EMAIL_VERIFICATION_OTP_TEMPLATE.replace('{{code}}', result.token),
      subject: 'Your Declarative Forms verification code',
      to: normalizedEmail,
    });

    if (delivery.error) {
      await emailVerificationRepository.delete(result.requestId);
      reply.status(502).send({
        error: {
          code: 'EMAIL_DELIVERY_FAILED',
          message: 'The verification email could not be delivered.',
        },
      });
      return;
    }

    return reply.header('Cache-Control', 'no-store').status(200).send({
      request_id: result.requestId,
      resend_after_seconds: 60,
    });
  },
  method: 'POST',
  url: '/api/v1/email-challenges/send',
};
