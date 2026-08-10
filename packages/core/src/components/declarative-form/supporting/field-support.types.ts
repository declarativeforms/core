import type {
  ControllerRenderProps,
  FieldValues,
  UseFormReturn,
} from 'react-hook-form';

import type { IRenderableField } from '@declarativeforms/engine';

export type DeclarativeFieldComponentProps<
  T extends IRenderableField = IRenderableField,
> = {
  controllerField: ControllerRenderProps<FieldValues, string>;
  field: T;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
};
