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
        className="bg-gray-50 h-50 leading-tight p-4 shadow-none text-gray-900 w-full placeholder:leading-tight placeholder:text-gray-400"
        placeholder={field.placeholder || "Your answer"}
      />
    </FormControl>
  );
}
