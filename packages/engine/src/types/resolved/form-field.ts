import type { IResolvedFormAddressField } from './form-address-field';
import type { IResolvedFormCameraField } from './form-camera-field';
import type { IResolvedFormDropdownField } from './form-dropdown-field';
import type { IResolvedFormEmailField } from './form-email-field';
import type { IResolvedFormFileUploadField } from './form-file-upload-field';
import type { IResolvedFormGenericField } from './form-generic-field';
import type { IResolvedFormGeolocationField } from './form-geolocation-field';
import type { IResolvedFormRatingField } from './form-rating-field';
import type { IResolvedFormSelectField } from './form-select-field';

/**
 * The discriminated union of every field in a localization-resolved form.
 * Narrow it on the `type` property to access a member's specific properties.
 */
export type IResolvedFormField =
  | IResolvedFormEmailField
  | IResolvedFormDropdownField
  | IResolvedFormRatingField
  | IResolvedFormAddressField
  | IResolvedFormSelectField
  | IResolvedFormGeolocationField
  | IResolvedFormCameraField
  | IResolvedFormFileUploadField
  | IResolvedFormGenericField;
