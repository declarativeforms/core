import type { IDeclarativeFormField } from '@declarativeforms/engine';

export type IAdaptiveTurn = {
  fields: Array<IDeclarativeFormField>;
  answers: Record<string, unknown>;
};
