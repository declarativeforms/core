import type { IFormMessage } from './form-message';

export type IFormMessagePage = {
  messages: Array<IFormMessage>;
  next_cursor: string | null;
};
