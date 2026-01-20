import yaml from "js-yaml";
import { useState } from "react";
import {
  FormProvider,
  useForm,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { Button } from "./ui/button";
import { FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { Input } from "./ui/input";

export type IDeclarativeFormField = {
  id: string;
  type: string;
  label: string;
  options?: Array<string>;
};

export type IDeclarativeFormSection = {
  id: string;
  title: string;
  fields: Array<IDeclarativeFormField>;
  next:
    | string
    | Array<
        | {
            when: string;
            go: string;
          }
        | { else: string }
      >;
};

export type IDeclarativeForm = {
  version: number;
  title: string;

  sections: Array<IDeclarativeFormSection>;
};

export function DeclarativeFormField(props: {
  field: IDeclarativeFormField;
  form: UseFormReturn<FieldValues, any, FieldValues>;
}) {
  return (
    <FormField
      control={props.form.control}
      name={props.field.id}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{props.field.label}</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          {/* <FormDescription>This is your public display name.</FormDescription>
          <FormMessage /> */}
        </FormItem>
      )}
    />
  );
}

export function DeclarativeFormSection(props: {
  section: IDeclarativeFormSection;
}) {
  const form = useForm();

  const [data, setData] = useState("");

  return (
    <FormProvider {...form}>
      <form>
        {props.section.fields.map(
          (field: IDeclarativeFormField, index: number) => (
            <DeclarativeFormField key={index} field={field} form={form} />
          )
        )}

        <Button>Continue</Button>
      </form>
    </FormProvider>
  );
}

export function DeclarativeForm() {
  const form: IDeclarativeForm = {
    version: 1,
    title: "Application",
    sections: [
      {
        id: "personal",
        title: "Personal",
        fields: [
          { id: "first_name", type: "text", label: "First Name" },
          { id: "last_name", type: "text", label: "Last Name" },
        ],
        next: "identity",
      },
      {
        id: "identity",
        title: "Identity",
        fields: [
          {
            id: "idType",
            type: "select",
            label: "ID type",
            options: ["Passport", "NationalID"],
          },
        ],
        next: [
          { when: 'idType == "Passport"', go: "passport" },
          { else: "nationalId" },
        ],
      },
      {
        id: "passport",
        title: "Passport",
        fields: [{ id: "passport", type: "text", label: "Passport" }],
        next: "done",
      },
      {
        id: "nationalId",
        title: "National ID",
        fields: [
          { id: "identity_number", type: "text", label: "Identity Number" },
        ],
        next: "done",
      },
    ],
  };

  const [activeSection, setActiveSection] = useState("personal"); // TODO

  return <DeclarativeFormSection section={form.sections[0]} />;
}
