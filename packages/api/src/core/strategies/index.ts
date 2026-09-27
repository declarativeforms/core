import type { IDeclarativeForm, ISubmission } from '@declarativeforms/engine';

export interface IConnectionStrategy {
  readonly type: string;
  deliver(
    connection: any,
    submission: ISubmission,
    form: IDeclarativeForm,
    sectionId?: string,
  ): Promise<void>;
}

export { EmailConnectionStrategy } from './email-connection.strategy';
export { WebhookConnectionStrategy } from './webhook-connection.strategy';
