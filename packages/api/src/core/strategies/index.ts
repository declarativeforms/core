import type { IDeclarativeForm, ISubmission } from '@declarativeforms/engine';

export interface IConnectionStrategy {
  readonly type: string;
  handle(
    connection: any,
    submission: ISubmission,
    form: IDeclarativeForm,
  ): Promise<void>;
}

export { EmailConnectionStrategy } from './email-connection.strategy';
export { WebhookConnectionStrategy } from './webhook-connection.strategy';
