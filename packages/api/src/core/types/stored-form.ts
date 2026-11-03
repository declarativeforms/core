import type { IDeclarativeForm } from '@declarativeforms/engine';

export type IStoredForm = {
  id: string;
  ownerId: string;
  definition: IDeclarativeForm;
};
