import { Input } from '../../ui';
import type { DeclarativeFieldComponentProps } from '../supporting/field-support';

export function HiddenField({
  controllerField,
}: DeclarativeFieldComponentProps) {
  return <Input {...controllerField} type="hidden" />;
}
