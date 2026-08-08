import type { IDeclarativeFormAddressField } from './form-address-field';
import type { IDeclarativeFormCameraField } from './form-camera-field';
import type { IDeclarativeFormDropdownField } from './form-dropdown-field';
import type { IDeclarativeFormEmailField } from './form-email-field';
import type { IDeclarativeFormFileUploadField } from './form-file-upload-field';
import type { IDeclarativeFormGenericField } from './form-generic-field';
import type { IDeclarativeFormGeolocationField } from './form-geolocation-field';
import type { IDeclarativeFormRatingField } from './form-rating-field';
import type { IDeclarativeFormSelectField } from './form-select-field';

/**
 * The discriminated union of every field a form may declare. Narrow it on the
 * `type` property to access a member's specific properties.
 */
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
