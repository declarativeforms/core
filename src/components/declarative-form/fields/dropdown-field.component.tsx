import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import {
  FormControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import type { IDeclarativeFormField } from "../types";

export function DropdownField({
  field,
  formField,
}: {
  field: IDeclarativeFormField;
  formField: ControllerRenderProps<FieldValues, string>;
}) {
  return (
    <Select onValueChange={formField.onChange} defaultValue={formField.value}>
      <FormControl>
        <SelectTrigger className="w-full !h-auto !py-3 px-3 bg-white border-neutral-200 hover:border-neutral-300 focus-visible:ring-neutral-900 focus-visible:ring-1 text-sm text-neutral-900 placeholder:text-neutral-400 rounded-md transition-colors duration-200 shadow-sm">
          <SelectValue
            placeholder={field.placeholder || `Select a ${field.label}`}
          />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {field.options?.map((option) => (
          <SelectItem
            key={option}
            value={option}
            className="py-2.5 text-sm cursor-pointer focus:bg-neutral-50 focus:text-neutral-900"
          >
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
