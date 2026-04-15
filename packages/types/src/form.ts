export type ILocalizedText = Record<string, string> | string;

export const DECLARATIVE_FIELD_TYPES = [
  'address',
  'address_country',
  'address_locality',
  'address_region',
  'camera',
  'date',
  'date_month',
  'dropdown',
  'email',
  'file_upload',
  'geolocation',
  'hidden',
  'long_text',
  'mobile_number',
  'multiple_select',
  'number',
  'rating',
  'short_text',
  'signature',
  'single_select',
  'time',
  'url',
] as const;

export type DeclarativeFieldType = (typeof DECLARATIVE_FIELD_TYPES)[number];

export function isDeclarativeFieldType(
  value: unknown,
): value is DeclarativeFieldType {
  return (
    typeof value === 'string' &&
    (DECLARATIVE_FIELD_TYPES as readonly string[]).includes(value)
  );
}

export const DECLARATIVE_CONNECTION_TYPES = ['email', 'webhook'] as const;

export type DeclarativeConnectionType =
  (typeof DECLARATIVE_CONNECTION_TYPES)[number];

export function isDeclarativeConnectionType(
  value: unknown,
): value is DeclarativeConnectionType {
  return (
    typeof value === 'string' &&
    (DECLARATIVE_CONNECTION_TYPES as readonly string[]).includes(value)
  );
}

export type IDeclarativeFormOption =
  | string
  | {
      label?: ILocalizedText;
      value?: string;
    };

export type IDeclarativeFormValidator =
  | 'required'
  | {
      type: 'required';
      message?: ILocalizedText;
    }
  | {
      type?: 'pattern';
      regex?: string;
      message?: ILocalizedText;
    }
  | {
      type?: 'min';
      value?: number | string;
      message?: ILocalizedText;
    }
  | {
      type?: 'max';
      value?: number | string;
      message?: ILocalizedText;
    }
  | {
      type?: 'min_length';
      value?: number;
      message?: ILocalizedText;
    }
  | {
      type?: 'max_length';
      value?: number;
      message?: ILocalizedText;
    }
  | {
      type?: 'expression';
      expression?: string;
      message?: ILocalizedText;
    };

export type IDeclarativeFormFieldBase = {
  id?: string;
  label?: ILocalizedText;
  placeholder?: ILocalizedText;
  validators?: Array<IDeclarativeFormValidator>;
  visible_when?: string;
};

export type IDeclarativeFormEmailField = IDeclarativeFormFieldBase & {
  type?: 'email';
  block_free_email?: boolean;
};

export type IDeclarativeFormDropdownField = IDeclarativeFormFieldBase & {
  type?: 'dropdown';
  searchable?: boolean;
  options?: Array<IDeclarativeFormOption>;
};

export type IDeclarativeFormRatingField = IDeclarativeFormFieldBase & {
  type?: 'rating';
  min_label?: ILocalizedText;
  max_label?: ILocalizedText;
};

export type IDeclarativeFormAddressField = IDeclarativeFormFieldBase & {
  type?: 'address' | 'address_locality' | 'address_region' | 'address_country';
  outputFormat?: 'string' | 'structured';
};

export type IDeclarativeFormSelectField = IDeclarativeFormFieldBase & {
  type?: 'single_select' | 'multiple_select';
  options?: Array<IDeclarativeFormOption>;
  allow_other?: boolean;
};

export type IDeclarativeFormGeolocationField = IDeclarativeFormFieldBase & {
  type?: 'geolocation';
};

export type IDeclarativeFormCameraField = IDeclarativeFormFieldBase & {
  type?: 'camera';
  facing_mode?: 'front' | 'rear';
};

export type IDeclarativeFormFileUploadField = IDeclarativeFormFieldBase & {
  type?: 'file_upload';
  accepted_mime_types?: string[];
};

export type IDeclarativeFormGenericField = IDeclarativeFormFieldBase & {
  type?:
    | 'date'
    | 'date_month'
    | 'hidden'
    | 'long_text'
    | 'mobile_number'
    | 'number'
    | 'signature'
    | 'short_text'
    | 'time'
    | 'url';
};

export type IDeclarativeFormField =
  | IDeclarativeFormEmailField
  | IDeclarativeFormDropdownField
  | IDeclarativeFormRatingField
  | IDeclarativeFormAddressField
  | IDeclarativeFormSelectField
  | IDeclarativeFormGeolocationField
  | IDeclarativeFormCameraField
  | IDeclarativeFormFileUploadField
  | IDeclarativeFormGenericField;

export type IDeclarativeFormSection = {
  id?: string;
  title?: ILocalizedText;
  fields?: Array<IDeclarativeFormField>;
  next?:
    | string
    | Array<
        | {
            when?: string;
            go?: string;
          }
        | { else?: string }
      >;
};

export type IDeclarativeFormCompletion = {
  title?: ILocalizedText;
  message?: ILocalizedText;
  button?: { label?: ILocalizedText; url?: ILocalizedText };
};

export type IDeclarativeFormCompletionRule = IDeclarativeFormCompletion & {
  when?: string;
};

export type IDeclarativeFormRawWebhookConnection = {
  type?: 'webhook';
  url?: string;
  when?: string;
};

export type IDeclarativeFormRawEmailConnection = {
  type?: 'email';
  to?: string;
  subject?: ILocalizedText;
  body?: ILocalizedText;
  include_responses?: boolean;
  when?: string;
};

export type IDeclarativeFormTheme = {
  primary?: string;
};

export type IDeclarativeForm = {
  id?: string;
  version?: number;
  title?: ILocalizedText;
  description?: ILocalizedText;
  completion?: IDeclarativeFormCompletion | IDeclarativeFormCompletionRule[];
  sections?: Array<IDeclarativeFormSection>;
  connections?: Array<
    IDeclarativeFormRawWebhookConnection | IDeclarativeFormRawEmailConnection
  >;
  start_date?: string;
  end_date?: string;
  locale?: string;
  measurements?: { mixpanel?: string };
  theme?: IDeclarativeFormTheme;
};

export type IStudioForm = IDeclarativeForm & {
  created_at?: string;
  updated_at?: string;
  collaborators?: string[];
};
