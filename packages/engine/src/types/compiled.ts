import type { IDeclarativeFormGenericFieldType } from './schema/form-generic-field-type';
import type { IDeclarativeFormMeasurements } from './schema/form-measurements';
import type { IDeclarativeFormTheme } from './schema/form-theme';

export type ICompiledValidationRule =
  | { type: 'required'; message: string }
  | { type: 'pattern'; regex: string; message: string }
  | { type: 'min_length'; value: number; message: string }
  | { type: 'max_length'; value: number; message: string }
  | { type: 'min'; value: number | string; message: string }
  | { type: 'max'; value: number | string; message: string }
  | { type: 'expression'; expression: string; message: string };

export type ICompiledFormOption = {
  label: string;
  value: string;
};

export type ICompiledFormFieldBase = {
  id: string;
  label: string;
  placeholder?: string;
  required: boolean;
  visible: boolean;
  visible_when?: string;
  validation: Array<ICompiledValidationRule>;
};

export type ICompiledFormGenericField = ICompiledFormFieldBase & {
  type: IDeclarativeFormGenericFieldType;
};
export type ICompiledFormEmailField = ICompiledFormFieldBase & {
  type: 'email';
};
export type ICompiledFormDropdownField = ICompiledFormFieldBase & {
  type: 'dropdown';
  searchable?: boolean;
  options: Array<ICompiledFormOption>;
};
export type ICompiledFormSelectField = ICompiledFormFieldBase & {
  type: 'single_select' | 'multiple_select';
  options: Array<ICompiledFormOption>;
  allow_other?: boolean;
};
export type ICompiledFormRatingField = ICompiledFormFieldBase & {
  type: 'rating';
  min_label?: string;
  max_label?: string;
};
export type ICompiledFormAddressField = ICompiledFormFieldBase & {
  type: 'address' | 'address_locality' | 'address_region' | 'address_country';
  outputFormat?: 'string' | 'structured';
};
export type ICompiledFormCameraField = ICompiledFormFieldBase & {
  type: 'camera';
  facing_mode?: 'front' | 'rear';
};
export type ICompiledFormFileUploadField = ICompiledFormFieldBase & {
  type: 'file_upload';
  accepted_mime_types?: Array<string>;
};
export type ICompiledFormGeolocationField = ICompiledFormFieldBase & {
  type: 'geolocation';
};

export type ICompiledFormField =
  | ICompiledFormEmailField
  | ICompiledFormDropdownField
  | ICompiledFormRatingField
  | ICompiledFormAddressField
  | ICompiledFormSelectField
  | ICompiledFormGeolocationField
  | ICompiledFormCameraField
  | ICompiledFormFileUploadField
  | ICompiledFormGenericField;

export type ICompiledFormButton = {
  label: string;
  url: string;
};

export type ICompiledFormCompletion = {
  title?: string;
  message?: string;
  button?: ICompiledFormButton;
};

export type ICompiledFormWebhookConnection = {
  type: 'webhook';
  url?: string;
};
export type ICompiledFormEmailConnection = {
  type: 'email';
  to?: string;
  subject?: string;
  body?: string;
  include_responses?: boolean;
};
export type ICompiledConnection =
  ICompiledFormWebhookConnection | ICompiledFormEmailConnection;
export type ICompiledEmailConnection = ICompiledFormEmailConnection;
export type ICompiledWebhookConnection = ICompiledFormWebhookConnection;

export type ICompiledFormSection = {
  id: string;
  title: string;
  fields: Array<ICompiledFormField>;
  next?: string;
};

export type ICompiledForm = {
  id?: string;
  version: number;
  title: string;
  description?: string;
  sections: Array<ICompiledFormSection>;
  completion?: ICompiledFormCompletion;
  connections: Array<ICompiledConnection>;
  locale: string;
  measurements?: IDeclarativeFormMeasurements;
  start_date?: string;
  end_date?: string;
  theme?: IDeclarativeFormTheme;
};
