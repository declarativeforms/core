import type { ICompiledFormEmailConnection } from './form-email-connection';
import type { ICompiledFormWebhookConnection } from './form-webhook-connection';

/**
 * The discriminated union of the connections that should fire for a compiled
 * form (each `when` gate already assessed against the data).
 */
export type ICompiledConnection =
  | ICompiledFormWebhookConnection
  | ICompiledFormEmailConnection;
