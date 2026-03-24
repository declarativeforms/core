import { createHash, createHmac, randomInt } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { faker } from '@faker-js/faker';
import { Resend } from 'resend';
import {
  consumeOneTimePinRequest,
  findOneTimePinRequest,
  findRecentOneTimePinRequest,
  incrementOneTimePinVerifyAttempts,
  insertOneTimePinRequest,
} from '../repositories';
import type { IOneTimePinRecord, IVerificationTokenPayload } from '../types';

const ONE_TIME_PIN_EMAIL_TEMPLATE = readFileSync(
  join(__dirname, 'templates', 'one-time-pin-email.html'),
  'utf-8',
);

const ONE_TIME_PIN_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_VERIFY_ATTEMPTS = 5;

function base64url(data: Buffer | string): string {
  const buf = typeof data === 'string' ? Buffer.from(data) : data;
  return buf.toString('base64url');
}

export function createOneTimePinVerificationToken(
  email: string,
  fieldId: string,
  requestId: string,
): string {
  const secret = process.env.ONE_TIME_PIN_SECRET;

  if (!secret) {
    throw new Error('ONE_TIME_PIN_SECRET is not configured');
  }

  const fullPayload: IVerificationTokenPayload = {
    email,
    field_id: fieldId,
    request_id: requestId,
    exp: Date.now() + ONE_TIME_PIN_EXPIRY_MS,
  };

  const encodedPayload = base64url(JSON.stringify(fullPayload));

  const signature = base64url(
    createHmac('sha256', secret).update(encodedPayload).digest(),
  );

  return `${encodedPayload}.${signature}`;
}

export function verifyOneTimePinVerificationToken(
  token: string,
): IVerificationTokenPayload | null {
  const secret = process.env.ONE_TIME_PIN_SECRET;

  if (!secret) {
    return null;
  }

  const parts = token.split('.');

  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, signature] = parts;

  const expectedSignature = base64url(
    createHmac('sha256', secret).update(encodedPayload).digest(),
  );

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload: IVerificationTokenPayload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString(),
    );

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function sendOneTimePinEmail(email: string, code: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: `Declarative Forms <${process.env.RESEND_FROM_EMAIL || 'noreply@example.com'}>`,
    to: email,
    subject: 'Your Declarative Forms verification code',
    html: ONE_TIME_PIN_EMAIL_TEMPLATE.replace('{{code}}', code),
  });
}

export async function createOneTimePinRequest(
  email: string,
  fieldId: string,
): Promise<{ requestId: string; resendAfterSeconds: number } | null> {
  const recent = await findRecentOneTimePinRequest(email, fieldId);

  if (recent) {
    const elapsed = Date.now() - new Date(recent.created_at).getTime();

    if (elapsed < RESEND_COOLDOWN_MS) {
      return null;
    }
  }

  const code = randomInt(100000, 1000000).toString();

  const now = new Date();

  const oneTimePinRequest: IOneTimePinRecord = {
    id: faker.string.alphanumeric({ casing: 'lower', length: 8 }),
    field_id: fieldId,
    email,
    one_time_pin_hash: createHash('sha256').update(code).digest('hex'),
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + ONE_TIME_PIN_EXPIRY_MS).toISOString(),
    consumed: false,
    verify_attempts: 0,
  };

  await insertOneTimePinRequest(oneTimePinRequest);

  await sendOneTimePinEmail(email, code);

  return {
    requestId: oneTimePinRequest.id,
    resendAfterSeconds: RESEND_COOLDOWN_MS / 1000,
  };
}

export async function verifyOneTimePinCode(
  requestId: string,
  email: string,
  code: string,
): Promise<string | null> {
  const oneTimePinRequest = await findOneTimePinRequest(requestId);

  if (!oneTimePinRequest) {
    return null;
  }

  if (oneTimePinRequest.email !== email) {
    return null;
  }

  if (new Date(oneTimePinRequest.expires_at).getTime() < Date.now()) {
    return null;
  }

  if (oneTimePinRequest.consumed) {
    return null;
  }

  if (oneTimePinRequest.verify_attempts >= MAX_VERIFY_ATTEMPTS) {
    return null;
  }

  await incrementOneTimePinVerifyAttempts(oneTimePinRequest.id);

  if (createHash('sha256').update(code).digest('hex') !== oneTimePinRequest.one_time_pin_hash) {
    return null;
  }

  await consumeOneTimePinRequest(oneTimePinRequest.id);

  return createOneTimePinVerificationToken(email, oneTimePinRequest.field_id, requestId);
}
