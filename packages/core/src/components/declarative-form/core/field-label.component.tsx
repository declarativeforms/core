'use client';
import type { IRenderableField } from '@declarativeforms/engine';
import { FieldLabel as BaseFieldLabel } from '@/components/ui';
import { HtmlText } from '../supporting/html-text';

export function FieldLabel(props: { field: IRenderableField }) {
  return (
    <BaseFieldLabel className="text-sm/4.5">
      <HtmlText html={props.field.label} />
      {props.field.required ? (
        <span className="font-medium text-red-500" aria-hidden="true">
          *
        </span>
      ) : null}
    </BaseFieldLabel>
  );
}
