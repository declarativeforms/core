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
  id?: string;
  version: number;
  title: string;
  description?: string;
  sections: Array<IDeclarativeFormSection>;
  connections: Array<{ type: "webhook"; url: string }>;
};
