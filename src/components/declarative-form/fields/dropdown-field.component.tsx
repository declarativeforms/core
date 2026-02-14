import { fieldSelectTriggerClass } from "../field-styles";
import type { DeclarativeFieldComponentProps } from "../field-contract";
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
  controllerField,
  meta,
}: DeclarativeFieldComponentProps) {
  return (
    <Select
      onValueChange={controllerField.onChange}
      defaultValue={controllerField.value}
    >
      <FormControl>
        <SelectTrigger
          className={fieldSelectTriggerClass}
          aria-required={meta.isRequired}
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
