import yaml from "js-yaml";
import { useState } from "react";
import {
  FormProvider,
  useForm,
  type FieldValues,
  type RegisterOptions,
  type UseFormReturn,
} from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui";

export type IDeclarativeFormField = {
  id: string;
  type: string;
  label: string;
  options?: Array<string>;
  placeholder?: string;
  validators?: Array<"required">;
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
  const rules: RegisterOptions = {};

  if (props.field.validators?.includes("required")) {
    rules.required = `${props.field.label} is required.`;
  }

  return (
    <FormField
      control={props.form.control}
      name={props.field.id}
      rules={rules}
      render={({ field }) => (
        <FormItem className="mb-6">
          <FormLabel className="text-neutral-900">
            {props.field.label}
          </FormLabel>
          {props.field.type === "select" ? (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      props.field.placeholder || `Select a ${props.field.label}`
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {props.field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <FormControl>
              <Input
                {...field}
                className="text-neutral-900 w-full"
                placeholder={props.field.placeholder}
                type={props.field.type}
              />
            </FormControl>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function DeclarativeFormSection(props: {
  data: FieldValues;
  section: IDeclarativeFormSection;
  onSubmit: (data: FieldValues) => void;
}) {
  const form = useForm({
    defaultValues: props.section.fields.reduce((acc, field) => {
      acc[field.id] = props.data[field.id];

      return acc;
    }, {} as FieldValues),
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((data: FieldValues) =>
          props.onSubmit(data)
        )}
      >
        {props.section.fields.map(
          (field: IDeclarativeFormField, index: number) => (
            <DeclarativeFormField key={index} field={field} form={form} />
          )
        )}

        <Button type="submit">Next</Button>
      </form>
    </FormProvider>
  );
}

export function DeclarativeForm() {
  const {
    data: formDef,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["form"],
    queryFn: async () => {
      const response = await fetch("/form.yaml");

      return yaml.load(await response.text()) as IDeclarativeForm;
    },
  });

  const [data, setData] = useState<FieldValues>({
    first_name: "Barend",
  });

  const [activeSectionId, setActiveSectionId] = useState("section_1"); // TODO

  if (isLoading) {
    return <></>;
  }

  if (error) {
    return <></>;
  }

  if (!formDef) {
    return null;
  }

  const activeSection = formDef.sections.find(
    (section) => section.id === activeSectionId
  );

  if (activeSectionId === "done") {
    return (
      <div className="flex h-lvh items-center justify-center max-w-3xl mx-auto">
        <div className="w-full">
          <h1 className="text-3xl font-bold mb-4">Application Complete!</h1>
          <p className="mb-8">Here is the data you submitted:</p>
          <pre className="p-4 bg-neutral-100 rounded-md">
            {JSON.stringify(data, null, 2)}
          </pre>
          <Button
            onClick={() => {
              setData({});
              setActiveSectionId("personal");
            }}
          >
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  if (!activeSection) {
    return <></>; // Or a not found component
  }

  return (
    <div className="flex h-lvh items-center justify-center max-w-lg mx-auto px-4">
      <div className="w-full">
        <DeclarativeFormSection
          key={activeSectionId}
          data={data}
          section={activeSection}
          onSubmit={(sectionData: FieldValues) => {
            const newData = { ...data, ...sectionData };
            setData(newData);

            const currentSection = formDef.sections.find(
              (section) => section.id === activeSectionId
            );

            if (!currentSection) {
              return;
            }

            let nextSectionId = "done";
            if (typeof currentSection.next === "string") {
              nextSectionId = currentSection.next;
            } else {
              for (const rule of currentSection.next) {
                if ("when" in rule) {
                  try {
                    const condition = new Function(
                      "data",
                      `return ${rule.when}`
                    );
                    if (condition(newData)) {
                      nextSectionId = rule.go;
                      break;
                    }
                  } catch (e) {
                    console.error("Error executing when condition:", e);
                  }
                } else if ("else" in rule) {
                  nextSectionId = rule.else;
                  break;
                }
              }
            }
            setActiveSectionId(nextSectionId);
          }}
        />
      </div>
    </div>
  );
}
