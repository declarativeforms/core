import type { IDeclarativeFormFieldBase } from './form-field-base';

export type IDeclarativeFormFileUploadField = IDeclarativeFormFieldBase & {
  type: 'file_upload';
  accepted_mime_types?: string[];
};
