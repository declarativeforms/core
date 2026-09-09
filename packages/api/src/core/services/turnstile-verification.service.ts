import type { TurnstileGateway } from '../gateways';
import type { TokenService } from './token.service';

export class TurnstileVerificationService {
  constructor(
    private tokenService: TokenService,
    private turnstileGateway: TurnstileGateway,
  ) {}

  public isConfigured(): boolean {
    return (
      this.tokenService.isConfigured() && this.turnstileGateway.isConfigured()
    );
  }

  public async verify(
    formId: string,
    fieldId: string,
    response: string,
  ): Promise<string | null> {
    if (
      !this.isConfigured() ||
      !(await this.turnstileGateway.verify(response))
    ) {
      return null;
    }

    return this.tokenService.createProof(formId, fieldId, 'verified');
  }
}
