import type { ICompiledFormFieldBase } from './form-field-base';

export type ICompiledFormFileUploadField = ICompiledFormFieldBase & {
  type: 'file_upload';
  accepted_mime_types?: string[];
};
