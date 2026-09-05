import type { IDeclarativeFormGenericFieldType } from './form-generic-field-type';
import type { IDeclarativeFormMeasurements } from './form-measurements';
import type { IDeclarativeFormNextRule } from './form-next-rule';
import type { IDeclarativeFormTheme } from './form-theme';

export type FormOption<Text> =
  | string
  | {
      label?: Text;
      value?: string;
    };

export type FormValidator<Text> =
  | 'required'
  | { type: 'required'; message?: Text }
  | { type: 'pattern'; regex: string; message?: Text }
  | { type: 'min'; value: number | string; message?: Text }
  | { type: 'max'; value: number | string; message?: Text }
  | { type: 'min_length'; value: number; message?: Text }
  | { type: 'max_length'; value: number; message?: Text }
  | { type: 'expression'; expression: string; message?: Text };

export type FormFieldBase<Text> = {
  id?: string;
  label?: Text;
  placeholder?: Text;
  validators?: Array<FormValidator<Text>>;
  visible_when?: string;
};

export type FormGenericField<Text> = FormFieldBase<Text> & {
  type: IDeclarativeFormGenericFieldType;
};

export type FormEmailField<Text> = FormFieldBase<Text> & {
  type: 'email';
  otp?: boolean;
};

export type FormDropdownField<Text> = FormFieldBase<Text> & {
  type: 'dropdown';
  searchable?: boolean;
  options?: Array<FormOption<Text>>;
};

export type FormSelectField<Text> = FormFieldBase<Text> & {
  type: 'single_select' | 'multiple_select';
  options?: Array<FormOption<Text>>;
  allow_other?: boolean;
};

export type FormRatingField<Text> = FormFieldBase<Text> & {
  type: 'rating';
  min_label?: Text;
  max_label?: Text;
};

export type FormAddressField<Text> = FormFieldBase<Text> & {
  type: 'address' | 'address_locality' | 'address_region' | 'address_country';
  outputFormat?: 'string' | 'structured';
};

export type FormCameraField<Text> = FormFieldBase<Text> & {
  type: 'camera';
  facing_mode?: 'front' | 'rear';
};

export type FormFileUploadField<Text> = FormFieldBase<Text> & {
  type: 'file_upload';
  accepted_mime_types?: Array<string>;
};

export type FormGeolocationField<Text> = FormFieldBase<Text> & {
  type: 'geolocation';
};

export type FormField<Text> =
  | FormEmailField<Text>
  | FormDropdownField<Text>
  | FormRatingField<Text>
  | FormAddressField<Text>
  | FormSelectField<Text>
  | FormGeolocationField<Text>
  | FormCameraField<Text>
  | FormFileUploadField<Text>
  | FormGenericField<Text>;

export type FormSection<Text> = {
  id?: string;
  title?: Text;
  description?: Text;
  fields?: Array<FormField<Text>>;
  next?: string | Array<IDeclarativeFormNextRule>;
};

export type FormButton<Text> = {
  label?: Text;
  url?: Text;
};

export type FormCompletion<Text> = {
  title?: Text;
  message?: Text;
  button?: FormButton<Text>;
};

export type FormCompletionRule<Text> = FormCompletion<Text> & {
  when?: string;
};

export type FormStart<Text> = {
  title?: Text;
  description?: Text;
  button?: Text;
};

export type FormConnectionBase = {
  when?: string;
  trigger_on?: 'completed' | 'partial' | 'any';
  delay_minutes?: number;
};

export type FormWebhookConnection = FormConnectionBase & {
  type: 'webhook';
  url?: string;
};

export type FormEmailConnection<Text> = FormConnectionBase & {
  type: 'email';
  to?: string;
  subject?: Text;
  body?: Text;
  include_responses?: boolean;
};

export type FormConnection<Text> =
  FormWebhookConnection | FormEmailConnection<Text>;

export type Form<Text> = {
  id?: string;
  version?: number;
  title?: Text;
  description?: Text;
  start?: FormStart<Text> | false;
  completion?: FormCompletion<Text> | Array<FormCompletionRule<Text>>;
  sections?: Array<FormSection<Text>>;
  connections?: Array<FormConnection<Text>>;
  start_date?: string;
  end_date?: string;
  locale?: string;
  measurements?: IDeclarativeFormMeasurements;
  theme?: IDeclarativeFormTheme;
};
