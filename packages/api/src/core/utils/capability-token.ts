import jwt from 'jsonwebtoken';

type CapabilityPurpose = 'resume' | 'upload';

type CapabilityPayload = {
  form_id: string;
  purpose: CapabilityPurpose;
  sub: string;
};

export function createCapabilityToken(
  purpose: CapabilityPurpose,
  subject: string,
  formId: string,
  expiresIn: string,
): string {
  return jwt.sign(
    {
      form_id: formId,
      purpose,
      sub: subject,
    },
    getCapabilitySecret(),
    { expiresIn } as jwt.SignOptions,
  );
}

export function verifyCapabilityToken(
  token: string,
  purpose: CapabilityPurpose,
  formId: string,
): CapabilityPayload | null {
  try {
    const payload = jwt.verify(token, getCapabilitySecret());
    if (
      typeof payload === 'string' ||
      payload.purpose !== purpose ||
      payload.form_id !== formId ||
      typeof payload.sub !== 'string'
    ) {
      return null;
    }

    return {
      form_id: payload.form_id,
      purpose: payload.purpose,
      sub: payload.sub,
    };
  } catch {
    return null;
  }
}

function getCapabilitySecret(): string {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error('AUTH_JWT_SECRET is required.');
  }
  return secret;
}
