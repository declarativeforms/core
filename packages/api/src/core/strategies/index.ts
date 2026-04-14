import type { IDeclarativeForm, ISubmission } from '@declarativeforms/types';

export interface IConnectionStrategy {
  readonly type: string;
  handle(
    connection: any,
    submission: ISubmission,
    form: IDeclarativeForm,
  ): Promise<void>;
}

export interface IValidationStrategy {
  validate(
    form: IDeclarativeForm,
    data: Record<string, unknown>,
    metadata?: { ip?: string; isPartial?: boolean },
  ): Promise<string | null>;
}

export { EmailConnectionStrategy } from './email-connection.strategy';
export { WebhookConnectionStrategy } from './webhook-connection.strategy';
