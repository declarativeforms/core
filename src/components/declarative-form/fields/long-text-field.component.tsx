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
        className="bg-gray-50 h-32 sm:h-50 leading-6 px-3.5 py-3 sm:py-4 shadow-none text-base text-gray-900 w-full placeholder:leading-6 placeholder:text-gray-400"
        placeholder={field.placeholder || "Your answer"}
      />
    </FormControl>
  );
}
