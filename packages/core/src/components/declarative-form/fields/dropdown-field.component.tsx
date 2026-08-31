'use client';

import type { IRenderableDropdownField } from '@declarativeforms/engine';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useI18n } from '@/i18n';
import { HtmlText } from '../supporting/html-text';
import type { FieldProps } from '../supporting/field.types';
import { SearchableDropdown } from './searchable-dropdown.component';

export function DropdownField({
  field,
  control,
}: FieldProps<IRenderableDropdownField, string>) {
  const { t } = useI18n();

  if (field.searchable) {
    return <SearchableDropdown field={field} control={control} />;
  }

  return (
    <Select onValueChange={control.onChange} value={control.value}>
      <SelectTrigger className="w-full text-sm/4" aria-required={field.required}>
        <SelectValue
          placeholder={
            field.placeholder || t('dropdown.select_a', { label: field.label })
          }
        />
      </SelectTrigger>
      <SelectContent>
        {field.options?.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <HtmlText html={option.label} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
