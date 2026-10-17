'use client';
import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';
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
  useMobileLayout,
  type FieldProps,
} from '@/components/declarative-form/supporting';
import { getDropdownOptions } from './dropdown';
import { SearchableDropdown } from './searchable-dropdown.component';
import { MobileDropdown } from './mobile-dropdown.component';

export function DropdownField(
  props: FieldProps<IRenderableDropdownField, string>,
): React.JSX.Element {
  const i18n = useI18n();
  const isMobile = useMobileLayout();
  const parentValue = useWatch({
    control: props.form.control,
    name: props.field.dependsOn ?? props.field.id,
  });
  const options = getDropdownOptions(props.field, parentValue);
  const disabled = props.field.dependsOn !== undefined && options.length === 0;
  const dependsOn = props.field.dependsOn;
  const onChange = props.control.onChange;
  const value = props.control.value;

  useEffect(() => {
    if (
      dependsOn &&
      value &&
      !options.some((option) => option.value === value)
    ) {
      onChange('');
    }
  }, [dependsOn, onChange, options, value]);

  if (isMobile) {
    return (
      <MobileDropdown
        key={String(disabled)}
        field={props.field}
        control={props.control}
        form={props.form}
        formId={props.formId}
        disabled={disabled}
        options={options}
      />
    );
  }

  if (props.field.searchable) {
    return (
      <SearchableDropdown
        field={props.field}
        control={props.control}
        form={props.form}
        formId={props.formId}
        disabled={disabled}
        options={options}
      />
    );
  }

  return (
    <Select
      disabled={disabled}
      onValueChange={props.control.onChange}
      value={props.control.value}
    >
      <SelectTrigger
        ref={(element) => props.control.ref(element)}
        onBlur={props.control.onBlur}
        id={props.control.name}
        className="w-full"
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
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <HtmlText html={option.label} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
