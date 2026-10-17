'use client';
import type { IRenderableField } from '@declarativeforms/engine';
import { FieldLabel as BaseFieldLabel } from '@/components/ui';
import { HtmlText } from '@/components/declarative-form/supporting';

export function FieldLabel(props: {
  field: IRenderableField;
}): React.JSX.Element | null {
  if (
    props.field.type === 'checkbox' ||
    (props.field.type === 'text_block' && !props.field.label.trim())
  ) {
    return null;
  }

  return (
    <BaseFieldLabel className="text-sm/4.5" htmlFor={props.field.id}>
      <HtmlText html={props.field.label} />
      {props.field.required ? (
        <span className="font-medium text-red-500" aria-hidden="true">
          *
        </span>
      ) : null}
    </BaseFieldLabel>
  );
}
