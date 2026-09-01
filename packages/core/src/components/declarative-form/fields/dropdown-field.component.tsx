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
import {
  HtmlText,
  type FieldProps,
} from '@/components/declarative-form/supporting';
import { SearchableDropdown } from './searchable-dropdown.component';

export function DropdownField(
  props: FieldProps<IRenderableDropdownField, string>,
) {
  const i18n = useI18n();

  if (props.field.searchable) {
    return <SearchableDropdown field={props.field} control={props.control} />;
  }

  return (
    <Select onValueChange={props.control.onChange} value={props.control.value}>
      <SelectTrigger
        className="w-full text-sm/4"
        aria-required={props.field.required}
      >
        <SelectValue
          placeholder={
            props.field.placeholder ||
            i18n.t('dropdown.select_a', { label: props.field.label })
          }
        />
      </SelectTrigger>
      <SelectContent>
        {props.field.options?.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <HtmlText html={option.label} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
