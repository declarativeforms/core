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
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Upload failed');
  }

  const uploadResponse = await response.json();
  return uploadResponse.url;
}
