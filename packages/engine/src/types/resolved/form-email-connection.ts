export type IResolvedFormEmailConnection = {
  type: 'email';
  to?: string;
  subject?: string;
  body?: string;
  include_responses?: boolean;
  when?: string;
};
