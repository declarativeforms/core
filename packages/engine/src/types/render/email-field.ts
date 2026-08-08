import type { IRenderableFieldBase } from './field-base';

/**
 * An email input. `min`/`max` are interpreted as the allowed character-length
 * range. When `otpEnabled`, a one-time-password flow is used and a companion
 * field named `tokenFieldName` holds the verification token. `blockFreeEmail`
 * rejects free/consumer email domains.
 */
export type IRenderableEmailField = IRenderableFieldBase & {
  type: 'email';
  min?: number;
  max?: number;
  otpEnabled: boolean;
  blockFreeEmail: boolean;
  tokenFieldName?: string;
};
