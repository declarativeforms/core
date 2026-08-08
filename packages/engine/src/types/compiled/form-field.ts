import type { ICompiledFormAddressField } from './form-address-field';
import type { ICompiledFormCameraField } from './form-camera-field';
import type { ICompiledFormDropdownField } from './form-dropdown-field';
import type { ICompiledFormEmailField } from './form-email-field';
import type { ICompiledFormFileUploadField } from './form-file-upload-field';
import type { ICompiledFormGenericField } from './form-generic-field';
import type { ICompiledFormGeolocationField } from './form-geolocation-field';
import type { ICompiledFormRatingField } from './form-rating-field';
import type { ICompiledFormSelectField } from './form-select-field';

/**
 * The discriminated union of every field in a compiled form. Narrow it on the
 * `type` property to access a member's specific properties.
 */
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
