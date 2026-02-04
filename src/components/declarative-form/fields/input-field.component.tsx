import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import { FormControl, Input } from "@/components/ui";
import type { IDeclarativeFormField } from "../types";

export function InputField({
  field,
  formField,
  type,
}: {
  field: IDeclarativeFormField;
  formField: ControllerRenderProps<FieldValues, string>;
  type: string;
}) {
  return (
    <FormControl>
      <Input
        {...formField}
        className="bg-gray-50 border border-gray-200 focus:border-gray-300 h-auto leading-normal py-3 px-4 shadow-none text-base text-gray-900 w-full placeholder:text-gray-400"
        placeholder={field.placeholder || "Your answer"}
        type={type}
      />
    </FormControl>
  );
}
