import type { IResolvedFormFieldBase } from './form-field-base';

export type IResolvedFormFileUploadField = IResolvedFormFieldBase & {
  type: 'file_upload';
  accepted_mime_types?: string[];
};
