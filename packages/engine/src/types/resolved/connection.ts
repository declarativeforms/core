import type { IDeclarativeFormWebhookConnection } from '../schema/form-webhook-connection';
import type { IResolvedFormEmailConnection } from './form-email-connection';

/**
 * The discriminated union of every connection in a localization-resolved form.
 * The webhook connection carries no text, so the schema type is reused as-is.
 */
export type IResolvedConnection =
  | IDeclarativeFormWebhookConnection
  | IResolvedFormEmailConnection;
