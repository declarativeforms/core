'use client';

import type { IRenderableDropdownField } from '@declarativeforms/engine';
import type { DeclarativeFieldComponentProps } from '../supporting/field-support.types';
import { HtmlText } from '../supporting/html-text';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useI18n } from '@/i18n';
import { SearchableDropdown } from './searchable-dropdown.component';

export function DropdownField({
  field,
  controllerField,
  form,
}: DeclarativeFieldComponentProps<IRenderableDropdownField>) {
  const { t } = useI18n();

  const { options } = field;

  if (field.searchable) {
    return (
      <SearchableDropdown
        field={field}
        controllerField={controllerField}
        form={form}
      />
    );
  }

  return (
    <Select
      onValueChange={controllerField.onChange}
      value={controllerField.value}
    >
      <SelectTrigger
        className="w-full text-sm/4"
        aria-required={field.required}
      >
        <SelectValue
          placeholder={
            field.placeholder || t('dropdown.select_a', { label: field.label })
          }
        />
      </SelectTrigger>
      <SelectContent>
        {options?.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <HtmlText html={option.label} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
