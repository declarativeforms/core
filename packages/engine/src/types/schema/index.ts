export * from './connection-type';
export * from './field-type';
export * from './form-generic-field-type';
export * from './form-measurements';
export * from './form-next-rule';
export * from './form-theme';
export * from './localized-text';
export * from './structured-address';
export * from './submission';

export * from './model';

import type { ILocalizedText } from './localized-text';
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
} from './model';

export type IDeclarativeForm = Form<ILocalizedText>;
export type IDeclarativeFormField = FormField<ILocalizedText>;
export type IDeclarativeFormFieldBase = FormFieldBase<ILocalizedText>;
export type IDeclarativeFormOption = FormOption<ILocalizedText>;
export type IDeclarativeFormValidator = FormValidator<ILocalizedText>;
export type IDeclarativeFormButton = FormButton<ILocalizedText>;
export type IDeclarativeFormCompletion = FormCompletion<ILocalizedText>;
export type IDeclarativeFormCompletionRule = FormCompletionRule<ILocalizedText>;
export type IDeclarativeFormSection = FormSection<ILocalizedText>;
export type IDeclarativeFormStart = FormStart<ILocalizedText>;
export type IDeclarativeFormEmailField = FormEmailField<ILocalizedText>;
export type IDeclarativeFormDropdownField = FormDropdownField<ILocalizedText>;
export type IDeclarativeFormSelectField = FormSelectField<ILocalizedText>;
export type IDeclarativeFormRatingField = FormRatingField<ILocalizedText>;
export type IDeclarativeFormAddressField = FormAddressField<ILocalizedText>;
export type IDeclarativeFormCameraField = FormCameraField<ILocalizedText>;
export type IDeclarativeFormFileUploadField =
  FormFileUploadField<ILocalizedText>;
export type IDeclarativeFormGeolocationField =
  FormGeolocationField<ILocalizedText>;
export type IDeclarativeFormGenericField = FormGenericField<ILocalizedText>;

export type IConnection = FormConnection<ILocalizedText>;
export type IDeclarativeFormEmailConnection =
  FormEmailConnection<ILocalizedText>;
export type IDeclarativeFormWebhookConnection = FormWebhookConnection;
export type IEmailConnection = FormEmailConnection<ILocalizedText>;
export type IWebhookConnection = FormWebhookConnection;
