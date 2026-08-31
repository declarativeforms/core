'use client';

import { getBackendUrl } from './api';

/**
 * Upload one file or blob and return the URL it is served from.
 *
 * The single shared piece of the three fields that upload (file upload, camera,
 * signature). Everything about how a field behaves while an upload is in
 * flight lives with the field.
 */
export async function uploadFile(
  file: File | Blob,
  filename?: string,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, filename);

  const response = await fetch(getBackendUrl('files/upload'), {
    body: formData,
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  const uploadResponse = await response.json();
  return uploadResponse.url as string;
}
