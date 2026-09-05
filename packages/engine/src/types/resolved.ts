import type {
  Form,
  FormAddressField,
  FormButton,
  FormCameraField,
  FormCompletion,
  FormCompletionRule,
  FormConnection,
  FormDropdownField,
  FormEmailConnection,
  FormEmailField,
  FormField,
  FormFieldBase,
  FormFileUploadField,
  FormGenericField,
  FormGeolocationField,
  FormOption,
  FormRatingField,
  FormSection,
  FormSelectField,
  FormStart,
  FormValidator,
  FormWebhookConnection,
} from './schema/model';

export type IResolvedForm = Form<string>;
export type IResolvedFormField = FormField<string>;
export type IResolvedFormFieldBase = FormFieldBase<string>;
export type IResolvedFormOption = FormOption<string>;
export type IResolvedFormValidator = FormValidator<string>;
export type IResolvedFormButton = FormButton<string>;
export type IResolvedFormCompletion = FormCompletion<string>;
export type IResolvedFormCompletionRule = FormCompletionRule<string>;
export type IResolvedFormSection = FormSection<string>;
export type IResolvedFormStart = FormStart<string>;
export type IResolvedFormEmailField = FormEmailField<string>;
export type IResolvedFormDropdownField = FormDropdownField<string>;
export type IResolvedFormSelectField = FormSelectField<string>;
export type IResolvedFormRatingField = FormRatingField<string>;
export type IResolvedFormAddressField = FormAddressField<string>;
export type IResolvedFormCameraField = FormCameraField<string>;
export type IResolvedFormFileUploadField = FormFileUploadField<string>;
export type IResolvedFormGeolocationField = FormGeolocationField<string>;
export type IResolvedFormGenericField = FormGenericField<string>;

export type IResolvedConnection = FormConnection<string>;
export type IResolvedFormEmailConnection = FormEmailConnection<string>;
export type IResolvedEmailConnection = FormEmailConnection<string>;
export type IResolvedWebhookConnection = FormWebhookConnection;
