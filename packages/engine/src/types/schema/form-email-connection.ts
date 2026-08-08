import type { ILocalizedText } from './localized-text';

export type IDeclarativeFormEmailConnection = {
  type: 'email';
  to?: string;
  subject?: ILocalizedText;
  body?: ILocalizedText;
  include_responses?: boolean;
  when?: string;
};
