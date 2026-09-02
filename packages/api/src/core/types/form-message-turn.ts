import type { IDeclarativeForm } from '@declarativeforms/engine';
import type { IFormMessage } from './form-message';
import type { IInternalFormSummary } from './internal-form';

export type IFormMessageTurn = {
  assistant_message: IFormMessage;
  branch: string;
  definition: IDeclarativeForm;
  revision: number;
  summary: IInternalFormSummary;
  user_message: IFormMessage;
};
