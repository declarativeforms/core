import type { IDeclarativeFormEmailConnection } from './form-email-connection';
import type { IDeclarativeFormWebhookConnection } from './form-webhook-connection';

/** The discriminated union of every connection a form may declare. */
export type IConnection =
  | IDeclarativeFormWebhookConnection
  | IDeclarativeFormEmailConnection;
