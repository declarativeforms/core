'use client';
import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadFile } from '@/lib/file-upload';

export function canvasToPngBlob(
  canvas: HTMLCanvasElement,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export type UploadBlob = {
  upload: (blob: Blob, filename: string) => Promise<string | null>;
  isUploading: boolean;
  manualError: string | null;
  uploadError: Error | null;
  setErrorMessage: (message: string | null) => void;
};

export function useUploadBlob(
  onChange: (value: string | null) => void,
): UploadBlob {
  const [manualError, setManualError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (variables: { blob: Blob; filename: string }) =>
      uploadFile(variables.blob, variables.filename),
    onSuccess: (url) => onChange(url),
  });

  const uploadBlob = mutation.mutateAsync;
  const resetUpload = mutation.reset;

  const upload = useCallback(
    async (blob: Blob, filename: string): Promise<string | null> => {
      setManualError(null);
      try {
        return await uploadBlob({ blob, filename });
      } catch {
        return null;
      }
    },
    [uploadBlob],
  );

  const setErrorMessage = useCallback(
    (message: string | null) => {
      resetUpload();
      setManualError(message);
    },
    [resetUpload],
  );

  return {
    upload,
    isUploading: mutation.isPending,
    manualError,
    uploadError: mutation.error,
    setErrorMessage,
  };
}
