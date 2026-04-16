import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Resend } from 'resend';
import { getContainer } from '../core';

const MAGIC_LINK_EMAIL_TEMPLATE = readFileSync(
  join(
    __dirname,
    '..',
    'core',
    'services',
    'templates',
    'magic-link-email.html',
  ),
  'utf-8',
);

export const AUTH_MAGIC_LINK_SEND_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { email: string; redirect_url: string; salt: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { studioMagicLinkService } = await getContainer();

    const result = await studioMagicLinkService.create(
      request.body.email,
      request.body.salt,
    );

    if (!result) {
      reply.status(429).send();

      return;
    }

    const separator = request.body.redirect_url.includes('?') ? '&' : '?';

    const link =
      `${request.body.redirect_url}${separator}` +
      `token=${result.token}&request_id=${result.requestId}`;

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: `Declarative Forms <${process.env.RESEND_FROM_EMAIL || 'noreply@example.com'}>`,
      html: MAGIC_LINK_EMAIL_TEMPLATE.replace('{{link}}', link),
      subject: 'Sign in to Declarative Forms Studio',
      to: request.body.email,
    });

    reply.status(200).send({
      request_id: result.requestId,
    });
  },
  method: 'POST',
  url: '/api/v1/auth/magic-link/send',
};
