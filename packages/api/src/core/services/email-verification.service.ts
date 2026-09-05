import { randomInt, timingSafeEqual } from 'node:crypto';
import type { EmailGateway } from '../gateways';
import type { TokenService } from './token.service';

const CHALLENGE_TOKEN_TYPE = 'email-challenge';
const CHALLENGE_TTL_SECONDS = 600;
const PROOF_TOKEN_TYPE = 'email-proof';

export class EmailVerificationService {
  constructor(
    private tokenService: TokenService,
    private emailGateway: EmailGateway,
  ) {}

  public isConfigured(): boolean {
    return (
      !!process.env.VERIFICATION_SECRET && this.emailGateway.isConfigured()
    );
  }

  public async request(
    formId: string,
    fieldId: string,
    emailAddress: string,
  ): Promise<string | null> {
    const normalizedEmailAddress = this.normalizeEmailAddress(emailAddress);
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const delivered = await this.emailGateway.sendVerificationCode(
      normalizedEmailAddress,
      code,
    );

    if (!delivered) {
      return null;
    }

    return this.tokenService.create<{
      code: string;
      emailAddress: string;
      fieldId: string;
      formId: string;
    }>(
      CHALLENGE_TOKEN_TYPE,
      {
        code,
        emailAddress: normalizedEmailAddress,
        fieldId,
        formId,
      },
      CHALLENGE_TTL_SECONDS,
    );
  }

  public verify(
    formId: string,
    fieldId: string,
    emailAddress: string,
    challenge: string,
    code: string,
  ): string | null {
    const payload = this.tokenService.verify<{
      code: string;
      emailAddress: string;
      fieldId: string;
      formId: string;
    }>(CHALLENGE_TOKEN_TYPE, challenge);
    const normalizedEmailAddress = this.normalizeEmailAddress(emailAddress);

    if (
      !payload ||
      payload.formId !== formId ||
      payload.fieldId !== fieldId ||
      payload.emailAddress !== normalizedEmailAddress ||
      payload.code.length !== code.length ||
      !timingSafeEqual(Buffer.from(payload.code), Buffer.from(code))
    ) {
      return null;
    }

    return this.tokenService.create<{
      emailAddress: string;
      fieldId: string;
      formId: string;
    }>(PROOF_TOKEN_TYPE, {
      emailAddress: normalizedEmailAddress,
      fieldId,
      formId,
    });
  }

  public verifyProof(
    formId: string,
    fieldId: string,
    emailAddress: string,
    token: unknown,
  ): boolean {
    if (typeof token !== 'string') {
      return false;
    }

    const payload = this.tokenService.verify<{
      emailAddress: string;
      fieldId: string;
      formId: string;
    }>(PROOF_TOKEN_TYPE, token);

    return (
      !!payload &&
      payload.formId === formId &&
      payload.fieldId === fieldId &&
      payload.emailAddress === this.normalizeEmailAddress(emailAddress)
    );
  }

  private normalizeEmailAddress(emailAddress: string): string {
    return emailAddress.trim().toLowerCase();
  }
}
