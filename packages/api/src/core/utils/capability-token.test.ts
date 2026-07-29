import jwt from 'jsonwebtoken';
import {
  createCapabilityToken,
  verifyCapabilityToken,
} from './capability-token';

describe('capability tokens', () => {
  const originalSecret = process.env.AUTH_JWT_SECRET;

  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = 'test-capability-secret';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.AUTH_JWT_SECRET;
    } else {
      process.env.AUTH_JWT_SECRET = originalSecret;
    }
  });

  test('scopes tokens to purpose, form, and subject', () => {
    const token = createCapabilityToken(
      'resume',
      'submission-id',
      'f123456789abc',
      '10m',
    );

    expect(
      verifyCapabilityToken(token, 'resume', 'f123456789abc'),
    ).toMatchObject({
      form_id: 'f123456789abc',
      purpose: 'resume',
      sub: 'submission-id',
    });
    expect(verifyCapabilityToken(token, 'upload', 'f123456789abc')).toBeNull();
    expect(verifyCapabilityToken(token, 'resume', 'fother')).toBeNull();
  });

  test('rejects expired tokens', () => {
    const token = jwt.sign(
      {
        form_id: 'f123456789abc',
        purpose: 'resume',
        sub: 'submission-id',
      },
      'test-capability-secret',
      { expiresIn: -1 },
    );

    expect(verifyCapabilityToken(token, 'resume', 'f123456789abc')).toBeNull();
  });
});
