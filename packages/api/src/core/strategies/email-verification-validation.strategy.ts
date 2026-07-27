import type { IDeclarativeForm } from '@declarativeforms/core';
import jwt from 'jsonwebtoken';
import type { IValidationStrategy } from '.';

export class EmailVerificationValidationStrategy
  implements IValidationStrategy
{
  public async validate(
    form: IDeclarativeForm,
    data: Record<string, unknown>,
  ): Promise<string | null> {
    for (const section of form.sections ?? []) {
      for (const field of section.fields ?? []) {
        if (field.type !== 'email' || !field.otp || !field.id) {
          continue;
        }

        const email = data[field.id];

        if (typeof email !== 'string' || !email) {
          continue;
        }

        const token = data[`${field.id}_token`];

        if (
          typeof token !== 'string' ||
          !this.matchesEmail(token, email)
        ) {
          return `Email verification is required for "${field.id}".`;
        }
      }
    }

    return null;
  }

  private matchesEmail(token: string, email: string): boolean {
    const secret = process.env.AUTH_JWT_SECRET;

    if (!secret) {
      return false;
    }

    try {
      const payload = jwt.verify(token, secret);

      return typeof payload !== 'string' && payload.sub === email;
    } catch {
      return false;
    }
  }
}
