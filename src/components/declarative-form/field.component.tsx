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

  // Extract min/max validators
  const minValidator = props.field.validators?.find(
    (v) => typeof v === "object" && v.type === "min"
  ) as { type: "min"; value: number | string; message?: string } | undefined;

  const maxValidator = props.field.validators?.find(
    (v) => typeof v === "object" && v.type === "max"
  ) as { type: "max"; value: number | string; message?: string } | undefined;

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

  // Add min/max validation based on field type
  if (
    props.field.type === "short_text" ||
    props.field.type === "long_text" ||
    props.field.type === "email" ||
    props.field.type === "url"
  ) {
    if (minValidator && typeof minValidator.value === "number") {
      rules.minLength = {
        value: minValidator.value,
        message:
          minValidator.message ||
          `${props.field.label} must be at least ${minValidator.value} characters.`,
      };
    }
    if (maxValidator && typeof maxValidator.value === "number") {
      rules.maxLength = {
        value: maxValidator.value,
        message:
          maxValidator.message ||
          `${props.field.label} must be at most ${maxValidator.value} characters.`,
      };
    }
  }

  if (props.field.type === "date") {
    if (minValidator) {
      rules.min = {
        value: minValidator.value,
        message:
          minValidator.message ||
          `${props.field.label} must be on or after ${minValidator.value}.`,
      };
    }
    if (maxValidator) {
      rules.max = {
        value: maxValidator.value,
        message:
          maxValidator.message ||
          `${props.field.label} must be on or before ${maxValidator.value}.`,
      };
    }
  }

  if (props.field.type === "file_upload") {
    rules.validate = (value) => {
      const fileCount = Array.isArray(value) ? value.length : value ? 1 : 0;

      if (isRequired && fileCount === 0) {
        return `${props.field.label} is required.`;
      }

      if (
        minValidator &&
        typeof minValidator.value === "number" &&
        fileCount < minValidator.value
      ) {
        return (
          minValidator.message ||
          `${props.field.label} requires at least ${minValidator.value} file${minValidator.value > 1 ? "s" : ""}.`
        );
      }

      if (
        maxValidator &&
        typeof maxValidator.value === "number" &&
        fileCount > maxValidator.value
      ) {
        return (
          maxValidator.message ||
          `${props.field.label} allows at most ${maxValidator.value} file${maxValidator.value > 1 ? "s" : ""}.`
        );
      }

      return true;
    };
  }

  if (props.field.type === "multiple_select") {
    rules.validate = (value) => {
      const selections = Array.isArray(value) ? value.length : 0;

      if (isRequired && selections === 0) {
        return `${props.field.label} is required.`;
      }

      if (
        minValidator &&
        typeof minValidator.value === "number" &&
        selections < minValidator.value
      ) {
        return (
          minValidator.message ||
          `${props.field.label} requires at least ${minValidator.value} selection${minValidator.value > 1 ? "s" : ""}.`
        );
      }

      if (
        maxValidator &&
        typeof maxValidator.value === "number" &&
        selections > maxValidator.value
      ) {
        return (
          maxValidator.message ||
          `${props.field.label} allows at most ${maxValidator.value} selection${maxValidator.value > 1 ? "s" : ""}.`
        );
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
