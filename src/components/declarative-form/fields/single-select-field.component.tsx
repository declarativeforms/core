import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormItem,
  FormLabel,
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui";
import type { IDeclarativeFormField } from "../types";

export function SingleSelectField({
  field,
  formField,
}: {
  field: IDeclarativeFormField;
  formField: ControllerRenderProps<FieldValues, string>;
}) {
  return (
    <FormControl>
      <RadioGroup
        className="flex flex-col space-y-2 gap-0"
        onValueChange={formField.onChange}
        defaultValue={formField.value}
      >
        {field.options?.map((option) => {
          const isSelected = formField.value === option;

          return (
            <FormItem key={option}>
              <FormLabel
                className={`flex items-center space-x-3 w-full border rounded-md p-3 cursor-pointer transition-all duration-200 shadow-sm ${
                  isSelected
                    ? "border-neutral-900 ring-1 ring-neutral-900 bg-neutral-50"
                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                }`}
              >
                <FormControl>
                  <RadioGroupItem value={option} />
                </FormControl>
                <span className="font-normal text-sm text-neutral-700 select-none flex-1">
                  {option}
                </span>
              </FormLabel>
            </FormItem>
          );
        })}
      </RadioGroup>
    </FormControl>
  );
}
