import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

const NONCE_LENGTH = 12;
const TAG_LENGTH = 16;
const VERIFICATION_PROOF_TOKEN_TYPE = 'verification-proof';

type TokenPayload = {
  expiresAt?: number;
};

export class TokenService {
  private configured: boolean;
  private key: Buffer;

  constructor(secret: string, purpose: string) {
    this.configured = !!secret;
    this.key = createHash('sha256')
      .update(`declarative-forms-${purpose}\0`)
      .update(secret)
      .digest();
  }

  public isConfigured(): boolean {
    return this.configured;
  }

  public create<T>(type: string, value: T, expiresIn?: number): string {
    const nonce = randomBytes(NONCE_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', this.key, nonce);
    cipher.setAAD(Buffer.from(type));

    const payload = Buffer.from(
      JSON.stringify({
        ...value,
        ...(expiresIn
          ? { expiresAt: Math.floor(Date.now() / 1000) + expiresIn }
          : {}),
      }),
    );
    const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);

    return `${type}.${Buffer.concat([
      nonce,
      cipher.getAuthTag(),
      encrypted,
    ]).toString('base64url')}`;
  }

  public verify<T>(type: string, token: string): (T & TokenPayload) | null {
    const prefix = `${type}.`;

    if (!token.startsWith(prefix)) {
      return null;
    }

    try {
      const encoded = token.slice(prefix.length);
      const value = Buffer.from(encoded, 'base64url');

      if (
        value.toString('base64url') !== encoded ||
        value.length <= NONCE_LENGTH + TAG_LENGTH
      ) {
        return null;
      }

      const nonce = value.subarray(0, NONCE_LENGTH);
      const tag = value.subarray(NONCE_LENGTH, NONCE_LENGTH + TAG_LENGTH);
      const encrypted = value.subarray(NONCE_LENGTH + TAG_LENGTH);
      const decipher = createDecipheriv('aes-256-gcm', this.key, nonce);
      decipher.setAAD(Buffer.from(type));
      decipher.setAuthTag(tag);

      const payload = JSON.parse(
        Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
          'utf8',
        ),
      ) as T & TokenPayload;

      if (
        payload.expiresAt !== undefined &&
        payload.expiresAt <= Math.floor(Date.now() / 1000)
      ) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  public createProof(formId: string, fieldId: string, value: string): string {
    return this.create<{
      fieldId: string;
      formId: string;
      value: string;
    }>(VERIFICATION_PROOF_TOKEN_TYPE, { fieldId, formId, value });
  }

  public verifyProof(
    formId: string,
    fieldId: string,
    value: string,
    token: unknown,
  ): boolean {
    if (!this.isConfigured() || typeof token !== 'string') {
      return false;
    }

    const payload = this.verify<{
      fieldId: string;
      formId: string;
      value: string;
    }>(VERIFICATION_PROOF_TOKEN_TYPE, token);

    return (
      !!payload &&
      payload.formId === formId &&
      payload.fieldId === fieldId &&
      payload.value === value
    );
  }
}
