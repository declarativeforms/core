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
      <FormControl className="bg-gray-50 !h-14 leading-tight !px-4 shadow-none text-gray-900 w-full placeholder:leading-tight placeholder:text-gray-400">
        <SelectTrigger>
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
