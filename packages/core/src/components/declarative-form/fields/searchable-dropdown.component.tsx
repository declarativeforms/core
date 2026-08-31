'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import type { IRenderableDropdownField } from '@declarativeforms/engine';
import type { FieldProps } from '../supporting/field.types';
import { HtmlText } from '../supporting/html-text';
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

export function SearchableDropdown({
  field,
  control,
}: FieldProps<IRenderableDropdownField, string>) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { options } = field;
  const selectedOption = options?.find(
    (option) => option.value === control.value,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-required={field.required}
          className={cn(
            'w-full justify-between text-sm/4 font-normal',
            !control.value && 'text-muted-foreground',
          )}
        >
          {selectedOption ? (
            <HtmlText html={selectedOption.label} />
          ) : (
            field.placeholder || t('dropdown.select_a', { label: field.label })
          )}
          <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={t('dropdown.search')} />
          <CommandList>
            <CommandEmpty>{t('dropdown.no_results')}</CommandEmpty>
            <CommandGroup>
              {options?.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    control.onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <HtmlText html={option.label} />
                  <Check
                    className={cn(
                      'ml-auto size-4',
                      control.value === option.value
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
