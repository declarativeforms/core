import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import { FormControl, Textarea } from "@/components/ui";
import type { IDeclarativeFormField } from "../types";

export function LongTextField({
  field,
  formField,
}: {
  field: IDeclarativeFormField;
  formField: ControllerRenderProps<FieldValues, string>;
}) {
  return (
    <FormControl>
      <Textarea
        {...formField}
        className="bg-gray-50 border border-gray-200 focus:border-gray-300 h-32 md:h-50 leading-normal px-4 py-3 shadow-none text-base text-gray-900 w-full placeholder:text-gray-400"
        placeholder={field.placeholder || "Your answer"}
      />
    </FormControl>
  );
}
