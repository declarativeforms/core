import { randomInt, timingSafeEqual } from 'node:crypto';
import type { EmailGateway } from '../gateways';
import type { TokenService } from './token.service';

const CHALLENGE_TOKEN_TYPE = 'email-challenge';
const CHALLENGE_TTL_SECONDS = 600;

export class EmailVerificationService {
  constructor(
    private tokenService: TokenService,
    private emailGateway: EmailGateway,
  ) {}

  public isConfigured(): boolean {
    return this.tokenService.isConfigured() && this.emailGateway.isConfigured();
  }

  public async request(
    formId: string,
    fieldId: string,
    emailAddress: string,
  ): Promise<string | null> {
    const normalizedEmailAddress = emailAddress.trim().toLowerCase();
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
    const normalizedEmailAddress = emailAddress.trim().toLowerCase();

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

    return this.tokenService.createProof(
      formId,
      fieldId,
      normalizedEmailAddress,
    );
  }
}
