import type {
  ControllerRenderProps,
  FieldValues,
  UseFormReturn,
} from 'react-hook-form';

import type { CompiledField } from '@declarativeforms/runtime';

export type DeclarativeFieldComponentProps = {
  controllerField: ControllerRenderProps<FieldValues, string>;
  field: CompiledField;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
};
