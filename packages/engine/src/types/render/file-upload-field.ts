import type { IRenderableFieldBase } from './field-base';

export type IRenderableFileUploadField = IRenderableFieldBase & {
  type: 'file_upload';
  min?: number;
  max?: number;
  acceptedMimeTypes: Array<string>;
  storesScalar: boolean;
};
