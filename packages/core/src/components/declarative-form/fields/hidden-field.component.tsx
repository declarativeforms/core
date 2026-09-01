'use client';

import type { IRenderableHiddenField } from '@declarativeforms/engine';

import { Input } from '@/components/ui';
import { bindTextInput } from '../supporting/bind-text-input';
import type { FieldProps } from '../supporting/field.types';

export function HiddenField(props: FieldProps<IRenderableHiddenField, string>) {
  return <Input {...bindTextInput(props.control)} type="hidden" />;
}
