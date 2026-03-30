import type { IDeclarativeForm } from "@/lib/declarative-form-types";

const DEFAULT_FORM_TEMPLATE: IDeclarativeForm = {
  version: 1,
  title: "Untitled Form",
  description: "A sample declarative form",
  sections: [
    {
      id: "personal_info",
      title: "Personal Information",
      fields: [
        {
          id: "first_name",
          type: "short_text",
          label: "First Name",
          placeholder: "Enter your first name",
          validators: ["required"],
        },
        {
          id: "last_name",
          type: "short_text",
          label: "Last Name",
          placeholder: "Enter your last name",
        },
        {
          id: "email",
          type: "email",
          label: "Email Address",
          placeholder: "you@example.com",
          validators: ["required"],
        },
      ],
      next: "done",
    },
  ],
  completion: {
    title: "Thank you!",
    message: "Thanks for submitting.",
  },
};

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createEmptyFormDefinition(): IDeclarativeForm {
  return cloneValue(DEFAULT_FORM_TEMPLATE);
}
