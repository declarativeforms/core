import type { IRenderableFieldBase } from './field-base';

/**
 * A file upload. `min`/`max` are interpreted as the allowed number of files.
 * `acceptedMimeTypes` gates the picker. `storesScalar` is true when a single
 * file is allowed (`max` is 1), so the value is a single URL string rather than
 * an array.
 */
export type IRenderableFileUploadField = IRenderableFieldBase & {
  type: 'file_upload';
  min?: number;
  max?: number;
  acceptedMimeTypes: string[];
  storesScalar: boolean;
};
