import type { IDeclarativeFormNextRule } from '../schema/form-next-rule';
import type { IResolvedFormField } from './form-field';

export type IResolvedFormSection = {
  id?: string;
  title?: string;
  fields?: Array<IResolvedFormField>;
  next?: string | Array<IDeclarativeFormNextRule>;
};
