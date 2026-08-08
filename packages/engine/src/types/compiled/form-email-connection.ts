/**
 * An email connection in a compiled form. `subject`/`body` templates are
 * populated to plain strings, and the `when` condition has been assessed away.
 */
export type ICompiledFormEmailConnection = {
  type: 'email';
  to?: string;
  subject?: string;
  body?: string;
  include_responses?: boolean;
};
