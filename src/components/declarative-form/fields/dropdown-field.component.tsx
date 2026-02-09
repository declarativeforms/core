import type { ControllerRenderProps, FieldValues } from "react-hook-form";

import { fieldSelectTriggerClass } from "../field-styles";
import type { IDeclarativeFormField } from "../types";
import {
  FormControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

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
        <SelectTrigger
          className={fieldSelectTriggerClass}
          aria-required={field.validators?.some((v) => v === "required")}
        >
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
