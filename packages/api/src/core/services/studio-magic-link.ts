import { createHash, randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import jwt from 'jsonwebtoken';
import { faker } from '@faker-js/faker';
import { Resend } from 'resend';
import {
  consumeStudioMagicLinkRequest,
  findRecentStudioMagicLinkRequest,
  findStudioMagicLinkRequest,
  insertStudioMagicLinkRequest,
} from '../repositories';
import type { IStudioMagicLinkRecord } from '../types';

const MAGIC_LINK_EMAIL_TEMPLATE = readFileSync(
  join(__dirname, 'templates', 'magic-link-email.html'),
  'utf-8',
);

const MAGIC_LINK_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const AUTH_JWT_EXPIRY = '7d';

async function sendMagicLinkEmail(email: string, link: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: `Declarative Forms <${process.env.RESEND_FROM_EMAIL || 'noreply@example.com'}>`,
    to: email,
    subject: 'Sign in to Declarative Forms Studio',
    html: MAGIC_LINK_EMAIL_TEMPLATE.replace('{{link}}', link),
  });
}

export async function createStudioMagicLinkRequest(
  email: string,
  redirectUrl: string,
): Promise<{ requestId: string; resendAfterSeconds: number } | null> {
  const recent = await findRecentStudioMagicLinkRequest(email);

  if (recent) {
    const elapsed = Date.now() - new Date(recent.created_at).getTime();

    if (elapsed < RESEND_COOLDOWN_MS) {
      return null;
    }
  }

  const token = randomBytes(32).toString('hex');

  const now = new Date();

  const record: IStudioMagicLinkRecord = {
    id: faker.string.alphanumeric({ casing: 'lower', length: 8 }),
    email,
    token_hash: createHash('sha256').update(token).digest('hex'),
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + MAGIC_LINK_EXPIRY_MS).toISOString(),
    consumed: false,
  };

  await insertStudioMagicLinkRequest(record);

  const separator = redirectUrl.includes('?') ? '&' : '?';
  const link = `${redirectUrl}${separator}token=${token}&request_id=${record.id}`;

  await sendMagicLinkEmail(email, link);

  return {
    requestId: record.id,
    resendAfterSeconds: RESEND_COOLDOWN_MS / 1000,
  };
}

export async function verifyStudioMagicLinkToken(
  requestId: string,
  token: string,
): Promise<{ token: string; user: { id: number; login: string; name: string | null; avatar_url: string; email: string | null } } | null> {
  const record = await findStudioMagicLinkRequest(requestId);

  if (!record) {
    return null;
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    return null;
  }

  if (record.consumed) {
    return null;
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');

  if (tokenHash !== record.token_hash) {
    return null;
  }

  await consumeStudioMagicLinkRequest(record.id);

  const secret = process.env.AUTH_JWT_SECRET;

  if (!secret) {
    throw new Error('AUTH_JWT_SECRET is not configured');
  }

  const jwtToken = jwt.sign(
    {
      github_id: 0,
      login: record.email,
      name: null,
      avatar_url: '',
      email: record.email,
    },
    secret,
    { expiresIn: AUTH_JWT_EXPIRY },
  );

  return {
    token: jwtToken,
    user: {
      id: 0,
      login: record.email,
      name: null,
      avatar_url: '',
      email: record.email,
    },
  };
}
