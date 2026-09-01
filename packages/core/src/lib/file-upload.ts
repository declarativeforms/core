'use client';

import { getBackendUrl } from './api';

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
