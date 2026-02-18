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
import { cn } from "@/lib/utils";

export function DropdownField({
  field,
  controllerField,
  form,
  meta,
}: DeclarativeFieldComponentProps) {
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
      defaultValue={controllerField.value}
    >
      <FormControl>
        <SelectTrigger className="w-full text-sm/4" aria-required={meta.isRequired}>
          <SelectValue
            placeholder={field.placeholder || `Select a ${field.label}`}
          />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {field.options?.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
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
  const [open, setOpen] = useState(false);

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
            {controllerField.value ||
              field.placeholder ||
              `Select a ${field.label}`}
            <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
      </FormControl>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {field.options?.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    controllerField.onChange(option);
                    setOpen(false);
                  }}
                >
                  {option}
                  <Check
                    className={cn(
                      "ml-auto size-4",
                      controllerField.value === option
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
