'use client';

import { Input } from '@/components/ui';
import type { DeclarativeFieldComponentProps } from '../supporting/field-support.types';

export function HiddenField({
  controllerField,
}: DeclarativeFieldComponentProps) {
  return <Input {...controllerField} type="hidden" />;
}
