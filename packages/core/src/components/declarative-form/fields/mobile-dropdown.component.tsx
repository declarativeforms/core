'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type {
  ICompiledFormOption,
  IRenderableDropdownField,
} from '@declarativeforms/engine';
import {
  Button,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui';
import {
  HtmlText,
  MobileSelectionSheet,
  bindElement,
  type FieldProps,
} from '@/components/declarative-form/supporting';
import { useI18n } from '@/i18n';
import { stripHtml } from '@/lib/strip-html';

export function MobileDropdown(
  props: FieldProps<IRenderableDropdownField, string> & {
    options: Array<ICompiledFormOption>;
    disabled: boolean;
  },
): React.JSX.Element {
  const i18n = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectedOption = props.options.find(
    (option) => option.value === props.control.value,
  );
  const visibleOptions = props.options.filter((option) =>
    stripHtml(option.label)
      .toLocaleLowerCase(i18n.locale)
      .includes(search.trim().toLocaleLowerCase(i18n.locale)),
  );

  function handleOpenChange(nextOpen: boolean): void {
    setOpen(nextOpen);
    setSearch('');
    if (!nextOpen) {
      props.control.onBlur();
    }
  }

  return (
    <MobileSelectionSheet
      open={open && !props.disabled}
      onOpenChange={handleOpenChange}
      title={props.field.label}
      trigger={
        <Button
          {...bindElement(props.control)}
          type="button"
          role="combobox"
          variant="outline"
          disabled={props.disabled}
          aria-required={props.field.required}
          data-placeholder={selectedOption ? undefined : true}
          className="form-combobox w-full justify-between font-normal"
        >
          <span className="min-w-0 truncate text-left">
            {selectedOption ? (
              <HtmlText html={selectedOption.label} />
            ) : (
              props.field.placeholder ||
              i18n.t('dropdown.select_a', {
                label: stripHtml(props.field.label),
              })
            )}
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </Button>
      }
    >
      {props.field.searchable && (
        <div className="shrink-0 border-b p-4">
          <Input
            type="search"
            aria-label={i18n.t('dropdown.search')}
            placeholder={i18n.t('dropdown.search')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}
      <div className="min-h-0 overflow-y-auto overscroll-contain p-2">
        <RadioGroup
          value={props.control.value ?? ''}
          aria-label={stripHtml(props.field.label)}
          className="gap-1"
          onValueChange={(value) => {
            props.control.onChange(value);
            handleOpenChange(false);
          }}
        >
          {visibleOptions.map((option) => (
            <Label
              key={option.value}
              className="form-selection-option flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-3 text-base font-normal has-[[data-state=checked]]:bg-accent"
            >
              <RadioGroupItem
                value={option.value}
                aria-label={stripHtml(option.label)}
                onClick={() => {
                  if (props.control.value === option.value) {
                    handleOpenChange(false);
                  }
                }}
              />
              <HtmlText
                html={option.label}
                className="min-w-0 flex-1 whitespace-normal wrap-anywhere"
              />
            </Label>
          ))}
        </RadioGroup>
        {visibleOptions.length === 0 && (
          <p
            role="status"
            className="p-4 text-center text-sm text-muted-foreground"
          >
            {i18n.t('dropdown.no_results')}
          </p>
        )}
      </div>
    </MobileSelectionSheet>
  );
}
