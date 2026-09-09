'use client';
import type { IRenderableHiddenField } from '@declarativeforms/engine';
import { Input } from '@/components/ui';
import {
  bindTextInput,
  type FieldProps,
} from '@/components/declarative-form/supporting';

export function HiddenField(props: FieldProps<IRenderableHiddenField, string>) {
  return <Input {...bindTextInput(props.control)} type="hidden" />;
}
