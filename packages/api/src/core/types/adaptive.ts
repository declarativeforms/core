import type { IResolvedFormField } from '@declarativeforms/engine';

export type IAdaptiveTurn = {
  fields: Array<IResolvedFormField>;
  answers: Record<string, unknown>;
};
