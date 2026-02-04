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
        <SelectTrigger className="bg-gray-50 border border-gray-200 focus:border-gray-300 !h-auto min-h-[48px] leading-normal !px-4 py-3 shadow-none text-gray-900 text-base w-full">
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
