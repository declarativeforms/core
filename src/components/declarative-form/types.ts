export type IDeclarativeFormField = {
  id: string;
  type:
    | "address"
    | "address_locality"
    | "address_region"
    | "address_country"
    | "date"
    | "dropdown"
    | "email"
    | "file_upload"
    | "hidden"
    | "long_text"
    | "mobile_number"
    | "multiple_select"
    | "number"
    | "rating"
    | "signature"
    | "short_text"
    | "single_select"
    | "url";
  label: string;
  max_label?: string;
  min_label?: string;
  options?: Array<string>;
  placeholder?: string;
  validators?: Array<
    | "required"
    | {
        type: "pattern";
        regex: string;
        message?: string;
      }
    | {
        type: "min";
        value: number | string;
        message?: string;
      }
    | {
        type: "max";
        value: number | string;
        message?: string;
      }
  >;
  visible_when?: string;
  outputFormat?: "string" | "structured";
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

export type ICompletion = {
  title?: string;
  message?: string;
  button?: { label: string; url: string };
};

export type IDeclarativeForm = {
  id?: string;
  version: number;
  title: string;
  description?: string;
  completion?: ICompletion;
  sections: Array<IDeclarativeFormSection>;
  connections: Array<
    | {
        type: "airtable";
        connection_id: string;
        base_id: string;
        table_id_or_name: string;
      }
    | { type: "webhook"; url: string }
    | {
        type: "email";
        to: string;
        subject: string;
        body?: string;
        include_responses?: boolean;
      }
  >;
  end_date?: string;
  mixpanel?: string;
};

export type ISubmission = {
  created_at: string;
  data: Record<string, any>;
  form_id: string;
  id: string;
  metadata: {
    ip_address: string;
    user_agent: string;
  };
  status: "partial" | "completed";
  updated_at: string;
};

export interface IStructuredAddress {
  formatted_address: string;
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  country?: string;
  postal_code?: string;
  place_id: string;
}

export type IConnection = IDeclarativeForm["connections"][number];
export type IWebhookConnection = Extract<IConnection, { type: "webhook" }>;
export type IAirtableConnection = Extract<IConnection, { type: "airtable" }>;
export type IEmailConnection = Extract<IConnection, { type: "email" }>;
