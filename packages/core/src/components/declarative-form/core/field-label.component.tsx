'use client';

import type { IRenderableField } from '@declarativeforms/engine';

import { FieldLabel as BaseFieldLabel } from '../../ui';
import { HtmlText } from '../supporting/html-text';

export function FieldLabel({ field }: { field: IRenderableField }) {
  return (
    <BaseFieldLabel className="text-sm/4.5">
      <HtmlText html={field.label} />
      {field.required ? (
        <span className="font-medium text-red-500" aria-hidden="true">
          *
        </span>
      ) : null}
    </BaseFieldLabel>
  );
}
