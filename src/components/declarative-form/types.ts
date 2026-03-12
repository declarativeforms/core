export type ILocalizedText = Record<string, string> | string;

export type IDeclarativeFormOption =
  | string
  | {
      label: ILocalizedText;
      value: string;
    };

export type IDeclarativeFormValidator =
  | "required"
  | {
      type: "pattern";
      regex: string;
      message?: ILocalizedText;
    }
  | {
      type: "min";
      value: number | string;
      message?: ILocalizedText;
    }
  | {
      type: "max";
      value: number | string;
      message?: ILocalizedText;
    }
  | {
      type: "min_length";
      value: number;
      message?: ILocalizedText;
    }
  | {
      type: "max_length";
      value: number;
      message?: ILocalizedText;
    };

type IDeclarativeFormFieldBase = {
  id: string;
  label: ILocalizedText;
  placeholder?: ILocalizedText;
  validators?: Array<IDeclarativeFormValidator>;
  visible_when?: string;
};

type IEmailField = IDeclarativeFormFieldBase & {
  type: "email";
  otp?: boolean;
};

type IDropdownField = IDeclarativeFormFieldBase & {
  type: "dropdown";
  searchable?: boolean;
  options?: Array<IDeclarativeFormOption>;
};

type IRatingField = IDeclarativeFormFieldBase & {
  type: "rating";
  min_label?: ILocalizedText;
  max_label?: ILocalizedText;
};

type IAddressField = IDeclarativeFormFieldBase & {
  type: "address" | "address_locality" | "address_region" | "address_country";
  outputFormat?: "string" | "structured";
};

type ISelectField = IDeclarativeFormFieldBase & {
  type: "single_select" | "multiple_select";
  options?: Array<IDeclarativeFormOption>;
};

type IGeolocationField = IDeclarativeFormFieldBase & {
  type: "geolocation";
};

type IGenericField = IDeclarativeFormFieldBase & {
  type:
    | "date"
    | "file_upload"
    | "hidden"
    | "long_text"
    | "mobile_number"
    | "number"
    | "signature"
    | "short_text"
    | "url";
};

export type IDeclarativeFormField =
  | IEmailField
  | IDropdownField
  | IRatingField
  | IAddressField
  | ISelectField
  | IGeolocationField
  | IGenericField;

export type IDeclarativeFormSection = {
  id: string;
  title: ILocalizedText;
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
  title?: ILocalizedText;
  message?: ILocalizedText;
  button?: { label: ILocalizedText; url: ILocalizedText };
};

export type IDeclarativeForm = {
  id?: string;
  version: number;
  title: ILocalizedText;
  description?: ILocalizedText;
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
        subject: ILocalizedText;
        body?: ILocalizedText;
        include_responses?: boolean;
      }
  >;
  start_date?: string;
  end_date?: string;
  locale?: string;
  measurements?: { mixpanel?: string };
};

export type ISubmission = {
  created_at: string;
  data: Record<string, unknown>;
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
