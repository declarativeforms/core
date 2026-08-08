/**
 * A webhook connection in a compiled form. Its `when` condition has been
 * assessed against the data, so a compiled connection is one that should fire
 * (the gate is no longer part of the shape).
 */
export type ICompiledFormWebhookConnection = {
  type: 'webhook';
  url?: string;
};
