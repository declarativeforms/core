export type IDeclarativeFormField = {
  id: string;
  type:
    | "date"
    | "dropdown"
    | "email"
    | "hidden"
    | "long_text"
    | "multiple_select"
    | "short_text"
    | "single_select"
    | "url";
  label: string;
  options?: Array<string>;
  placeholder?: string;
  validators?: Array<
    | "required"
    | {
        type: "pattern";
        regex: string;
        message?: string;
      }
  >;
  visible_when?: string;
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
  connections: Array<
    | {
        type: "airtable";
        connection_id: string;
        base_id: string;
        table_id_or_name: string;
      }
    | { type: "webhook"; url: string }
  >;
  mixpanel?: string;
};

export type ISubmission = {
  created_at: string;
  data: Record<string, any>;
  form_id: string;
  id: string;
  status: "partial" | "completed";
  updated_at: string;
};
