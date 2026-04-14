import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Resend } from 'resend';
import { getContainer } from '../core';

const MAGIC_LINK_EMAIL_TEMPLATE = readFileSync(
  join(__dirname, '..', 'core', 'services', 'templates', 'magic-link-email.html'),
  'utf-8',
);

export const AUTH_MAGIC_LINK_SEND_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { email: string; redirect_url: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { email, redirect_url } = request.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      reply.status(400).send({ error: 'Invalid email address' });
      return;
    }

    if (!redirect_url) {
      reply.status(400).send({ error: 'redirect_url is required' });
      return;
    }

    const { studioMagicLinkService } = await getContainer();
    const normalizedEmail = email.trim().toLowerCase();
    const result = await studioMagicLinkService.createRequest({
      email: normalizedEmail,
    });

    if (!result) {
      reply.status(429).send({ error: 'Please wait before requesting another link' });
      return;
    }

    const separator = redirect_url.includes('?') ? '&' : '?';
    const link = `${redirect_url}${separator}token=${result.token}&request_id=${result.requestId}`;
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: `Declarative Forms <${process.env.RESEND_FROM_EMAIL || 'noreply@example.com'}>`,
      html: MAGIC_LINK_EMAIL_TEMPLATE.replace('{{link}}', link),
      subject: 'Sign in to Declarative Forms Studio',
      to: normalizedEmail,
    });

    reply.status(200).send({
      request_id: result.requestId,
      resend_after_seconds: result.resendAfterSeconds,
    });
  },
  method: 'POST',
  url: '/api/v1/auth/magic-link/send',
};
