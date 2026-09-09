import type { IRenderableAddressField } from './address-field';
import type { IRenderableCameraField } from './camera-field';
import type { IRenderableDateField } from './date-field';
import type { IRenderableDropdownField } from './dropdown-field';
import type { IRenderableEmailField } from './email-field';
import type { IRenderableFileUploadField } from './file-upload-field';
import type { IRenderableGeolocationField } from './geolocation-field';
import type { IRenderableHiddenField } from './hidden-field';
import type { IRenderableLongTextField } from './long-text-field';
import type { IRenderableMultipleSelectField } from './multiple-select-field';
import type { IRenderableNumberField } from './number-field';
import type { IRenderableRatingField } from './rating-field';
import type { IRenderableSignatureField } from './signature-field';
import type { IRenderableSingleSelectField } from './single-select-field';
import type { IRenderableTextBlockField } from './text-block-field';
import type { IRenderableTextField } from './text-field';
import type { IRenderableTurnstileField } from './turnstile-field';

export type IRenderableField =
  | IRenderableTextField
  | IRenderableTurnstileField
  | IRenderableNumberField
  | IRenderableDateField
  | IRenderableLongTextField
  | IRenderableEmailField
  | IRenderableDropdownField
  | IRenderableSingleSelectField
  | IRenderableMultipleSelectField
  | IRenderableRatingField
  | IRenderableAddressField
  | IRenderableFileUploadField
  | IRenderableSignatureField
  | IRenderableCameraField
  | IRenderableGeolocationField
  | IRenderableTextBlockField
  | IRenderableHiddenField;
