import type { IDeclarativeForm } from '@declarativeforms/core';
import jwt from 'jsonwebtoken';
import { EmailVerificationValidationStrategy } from './email-verification-validation.strategy';

const form: IDeclarativeForm = {
  sections: [
    {
      id: 'contact',
      fields: [{ id: 'email', type: 'email', otp: true }],
    },
  ],
};

describe('EmailVerificationValidationStrategy', () => {
  const originalSecret = process.env.AUTH_JWT_SECRET;

  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.AUTH_JWT_SECRET;
    } else {
      process.env.AUTH_JWT_SECRET = originalSecret;
    }
  });

  test('accepts a token issued for the submitted email', async () => {
    const strategy = new EmailVerificationValidationStrategy();
    const token = jwt.sign({ sub: 'person@example.com' }, 'test-secret');

    await expect(
      strategy.validate(form, {
        email: 'person@example.com',
        email_token: token,
      }),
    ).resolves.toBeNull();
  });

  test('rejects a token issued for a different email', async () => {
    const strategy = new EmailVerificationValidationStrategy();
    const token = jwt.sign({ sub: 'other@example.com' }, 'test-secret');

    await expect(
      strategy.validate(form, {
        email: 'person@example.com',
        email_token: token,
      }),
    ).resolves.toBe('Email verification is required for "email".');
  });
});
