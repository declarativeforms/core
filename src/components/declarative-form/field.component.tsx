import {
  useWatch,
  type FieldValues,
  type RegisterOptions,
  type UseFormReturn,
} from "react-hook-form";
import {
  AddressField,
  DropdownField,
  FileUploadField,
  InputField,
  LongTextField,
  MultipleSelectField,
  SingleSelectField,
} from "./fields";
import type { IDeclarativeFormField } from "./types";
import { FormField, FormItem, FormLabel } from "../ui";

export function DeclarativeFormField(props: {
  field: IDeclarativeFormField;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
}) {
  const formData = useWatch({ control: props.form.control });

  const isVisible = (() => {
    if (!props.field.visible_when) {
      return true;
    }

    const condition = new Function(
      "data",
      `return ${props.field.visible_when}`
    );

    return condition(formData);
  })();

  if (!isVisible) {
    return null;
  }

  const isRequired = props.field.validators?.some((v) => v === "required");

  const rules: RegisterOptions = {};

  if (props.field.validators) {
    for (const validator of props.field.validators) {
      if (validator === "required") {
        rules.required = `${props.field.label} is required.`;
      } else if (
        typeof validator === "object" &&
        validator.type === "pattern"
      ) {
        rules.pattern = {
          value: new RegExp(validator.regex),
          message: validator.message || `${props.field.label} is invalid.`,
        };
      }
    }
  }

  if (props.field.type === "file_upload") {
    rules.validate = (value) => {
      if (
        isRequired &&
        (!value || (Array.isArray(value) && value.length === 0))
      ) {
        return `${props.field.label} is required.`;
      }
      return true;
    };
  }

  const Label = () => (
    <FormLabel className="block font-medium text-base text-gray-900 tracking-tight">
      {props.field.label}
      {isRequired && (
        <span className="font-medium text-sm ml-1 text-red-500" aria-hidden="true">
          *
        </span>
      )}
    </FormLabel>
  );

  return (
    <FormField
      control={props.form.control}
      name={props.field.id}
      rules={rules}
      render={({ field }) => (
        <FormItem className="gap-3 group">
          {Label()}
          {(props.field.type === "address" ||
            props.field.type === "address_locality" ||
            props.field.type === "address_region" ||
            props.field.type === "address_country") ? (
            <AddressField field={props.field} formField={field} />
          ) : null}
          {props.field.type === "date" ? (
            <InputField field={props.field} formField={field} type="date" />
          ) : null}
          {props.field.type === "dropdown" ? (
            <DropdownField field={props.field} formField={field} />
          ) : null}
          {props.field.type === "email" ? (
            <InputField field={props.field} formField={field} type="email" />
          ) : null}
          {props.field.type === "file_upload" ? (
            <FileUploadField field={props.field} formField={field} />
          ) : null}
          {props.field.type === "long_text" ? (
            <LongTextField field={props.field} formField={field} />
          ) : null}
          {props.field.type === "multiple_select" ? (
            <MultipleSelectField
              field={props.field}
              formControl={props.form.control}
            />
          ) : null}
          {props.field.type === "short_text" ? (
            <InputField field={props.field} formField={field} type="text" />
          ) : null}
          {props.field.type === "single_select" ? (
            <SingleSelectField field={props.field} formField={field} />
          ) : null}
          {props.field.type === "url" ? (
            <InputField field={props.field} formField={field} type="url" />
          ) : null}
        </FormItem>
      )}
    />
  );
}
