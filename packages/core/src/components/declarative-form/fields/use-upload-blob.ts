'use client';

import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { uploadFile } from '@/lib/file-upload';

/**
 * Read a canvas as a PNG blob. Shared by the two fields that capture a drawing
 * (camera, signature); `toBlob` is callback-based, so it needs wrapping.
 */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/**
 * Upload a captured blob and expose its URL via `onChange`, with upload/error
 * state for the field to render. Shared by the two media-capture fields that
 * live alongside it.
 *
 * `error` is returned raw rather than as a message: the fallback wording is the
 * field's own, so the hook stays free of translation keys.
 */
export function useUploadBlob(onChange: (value: string | null) => void) {
  const [manualError, setManualError] = useState<string | null>(null);

  const { mutateAsync, reset, isPending, error } = useMutation({
    mutationFn: ({ blob, filename }: { blob: Blob; filename: string }) =>
      uploadFile(blob, filename),
    onSuccess: (url) => onChange(url),
  });

  const upload = useCallback(
    async (blob: Blob, filename: string): Promise<string | null> => {
      setManualError(null);
      try {
        return await mutateAsync({ blob, filename });
      } catch {
        return null;
      }
    },
    [mutateAsync],
  );

  const setErrorMessage = useCallback(
    (message: string | null) => {
      reset();
      setManualError(message);
    },
    [reset],
  );

  return {
    upload,
    isUploading: isPending,
    manualError,
    uploadError: error,
    setErrorMessage,
  };
}
