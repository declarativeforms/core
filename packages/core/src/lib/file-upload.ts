'use client';
import type { IUploadedFile } from '@declarativeforms/engine';
import { getBackendUrl } from './api';

export async function uploadFile(
  file: File | Blob,
  filename?: string,
): Promise<IUploadedFile> {
  const formData = new FormData();
  if (filename) {
    formData.append('file', file, filename);
  } else {
    formData.append('file', file);
  }

  const response = await fetch(getBackendUrl('files/upload'), {
    body: formData,
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  const uploadResponse = await response.json();

  return uploadResponse as IUploadedFile;
}
