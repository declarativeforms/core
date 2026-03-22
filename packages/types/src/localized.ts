import type {
  IDeclarativeFormRawAirtableConnection,
  IDeclarativeFormRawWebhookConnection,
  IDeclarativeFormSection,
} from "./form";

// ---------------------------------------------------------------------------
// ILocalizedFormValidator — same shape as IDeclarativeFormValidator but with
// ILocalizedText resolved to string.
// ---------------------------------------------------------------------------

export type ILocalizedFormValidator =
  | "required"
  | { type?: "pattern"; regex?: string; message?: string }
  | { type?: "min"; value?: number | string; message?: string }
  | { type?: "max"; value?: number | string; message?: string }
  | { type?: "min_length"; value?: number; message?: string }
  | { type?: "max_length"; value?: number; message?: string }
  | { type?: "expression"; expression?: string; message?: string };

// ---------------------------------------------------------------------------
// ILocalizedFormOption — same shape as IDeclarativeFormOption but with
// ILocalizedText resolved to string.
// ---------------------------------------------------------------------------

export type ILocalizedFormOption = string | { label?: string; value?: string };

// ---------------------------------------------------------------------------
// Localized field types — same shape as their IDeclarativeFormField
// counterparts but with ILocalizedText resolved to string.
// ---------------------------------------------------------------------------

export type ILocalizedFormFieldBase = {
  id?: string;
  label?: string;
  placeholder?: string;
  validators?: ILocalizedFormValidator[];
  visible_when?: string;
};

export type ILocalizedEmailField = ILocalizedFormFieldBase & {
  type?: "email";
  otp?: boolean;
  block_free_email?: boolean;
};

export type ILocalizedDropdownField = ILocalizedFormFieldBase & {
  type?: "dropdown";
  searchable?: boolean;
  options?: ILocalizedFormOption[];
};

export type ILocalizedRatingField = ILocalizedFormFieldBase & {
  type?: "rating";
  min_label?: string;
  max_label?: string;
};

export type ILocalizedAddressField = ILocalizedFormFieldBase & {
  type?: "address" | "address_locality" | "address_region" | "address_country";
  outputFormat?: "string" | "structured";
};

export type ILocalizedSelectField = ILocalizedFormFieldBase & {
  type?: "single_select" | "multiple_select";
  options?: ILocalizedFormOption[];
  allow_other?: boolean;
};

export type ILocalizedGeolocationField = ILocalizedFormFieldBase & {
  type?: "geolocation";
};

export type ILocalizedCameraField = ILocalizedFormFieldBase & {
  type?: "camera";
  facing_mode?: "front" | "rear";
};

export type ILocalizedTurnstileField = ILocalizedFormFieldBase & {
  type?: "turnstile";
};

export type ILocalizedGenericField = ILocalizedFormFieldBase & {
  type?:
    | "date"
    | "date_month"
    | "file_upload"
    | "hidden"
    | "long_text"
    | "mobile_number"
    | "number"
    | "signature"
    | "short_text"
    | "time"
    | "url";
};

export type ILocalizedFormField =
  | ILocalizedEmailField
  | ILocalizedDropdownField
  | ILocalizedRatingField
  | ILocalizedAddressField
  | ILocalizedSelectField
  | ILocalizedGeolocationField
  | ILocalizedCameraField
  | ILocalizedTurnstileField
  | ILocalizedGenericField;

// ---------------------------------------------------------------------------
// ILocalizedFormSection — same shape as IDeclarativeFormSection but with
// ILocalizedText resolved to string.
// ---------------------------------------------------------------------------

export type ILocalizedFormSection = {
  id?: string;
  title?: string;
  fields?: ILocalizedFormField[];
  next?: IDeclarativeFormSection["next"];
};

// ---------------------------------------------------------------------------
// ILocalizedFormCompletion — same shape as IDeclarativeFormCompletion but
// with ILocalizedText resolved to string.
// ---------------------------------------------------------------------------

export type ILocalizedFormCompletion = {
  title?: string;
  message?: string;
  button?: { label?: string; url?: string };
};

export type ILocalizedFormCompletionRule = ILocalizedFormCompletion & {
  when?: string;
};

// ---------------------------------------------------------------------------
// ILocalizedRawEmailConnection — same shape as IDeclarativeFormRawEmailConnection
// but with ILocalizedText resolved to string.
// ---------------------------------------------------------------------------

export type ILocalizedRawEmailConnection = {
  type?: "email";
  to?: string;
  subject?: string;
  body?: string;
  include_responses?: boolean;
  when?: string;
};

export type ILocalizedFormConnection =
  | IDeclarativeFormRawAirtableConnection
  | IDeclarativeFormRawWebhookConnection
  | ILocalizedRawEmailConnection;

// ---------------------------------------------------------------------------
// ILocalizedForm — exactly the same structure as IDeclarativeForm but with
// every ILocalizedText property resolved to a plain string.
// ---------------------------------------------------------------------------

export type ILocalizedForm = {
  id?: string;
  version?: number;
  title?: string;
  description?: string;
  completion?: ILocalizedFormCompletion | ILocalizedFormCompletionRule[];
  sections?: ILocalizedFormSection[];
  connections?: ILocalizedFormConnection[];
  start_date?: string;
  end_date?: string;
  locale?: string;
  measurements?: { mixpanel?: string };
  theme?: { primary?: string };
};
