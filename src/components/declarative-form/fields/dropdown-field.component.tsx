import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import type { DeclarativeFieldComponentProps } from "../field-contract";
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  FormControl,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export function DropdownField({
  field,
  controllerField,
  form,
  meta,
}: DeclarativeFieldComponentProps) {
  const { t } = useI18n();

  if (field.searchable) {
    return (
      <SearchableDropdown
        field={field}
        controllerField={controllerField}
        form={form}
        meta={meta}
      />
    );
  }

  return (
      <Select
      onValueChange={controllerField.onChange}
      value={controllerField.value}
    >
      <FormControl>
        <SelectTrigger className="w-full text-sm/4" aria-required={meta.isRequired}>
          <SelectValue
            placeholder={
              field.placeholder || t("dropdown.select_a", { label: field.label })
            }
          />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {field.options?.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SearchableDropdown({
  field,
  controllerField,
  meta,
}: DeclarativeFieldComponentProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const selectedOption = field.options?.find(
    (option) => option.value === controllerField.value
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FormControl>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-required={meta.isRequired}
            className={cn(
              "w-full justify-between text-sm/4 font-normal",
              !controllerField.value && "text-muted-foreground"
            )}
          >
            {selectedOption?.label ||
              field.placeholder ||
              t("dropdown.select_a", { label: field.label })}
            <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
      </FormControl>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("dropdown.search")} />
          <CommandList>
            <CommandEmpty>{t("dropdown.no_results")}</CommandEmpty>
            <CommandGroup>
              {field.options?.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    controllerField.onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  <Check
                    className={cn(
                      "ml-auto size-4",
                      controllerField.value === option.value
                        ? "opacity-100"
                        : "opacity-0"
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
