'use client';

import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import type { TranslationKey } from '@/i18n/messages/en';
import { uploadFile } from '@/lib/file-upload';
import { useI18n } from '@/i18n';

/**
 * Upload a captured blob (camera photo, signature image) and expose its URL via
 * `onChange`, with upload/error state for the field to render. Shared by the
 * two media-capture fields that live alongside it.
 */
export function useUploadBlob(
  onChange: (value: string | null) => void,
  fallbackErrorKey: TranslationKey,
) {
  const { t } = useI18n();
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

  const errorMessage =
    manualError ??
    (error ? (error instanceof Error ? error.message : t(fallbackErrorKey)) : null);

  return {
    upload,
    isUploading: isPending,
    errorMessage,
    setErrorMessage,
  };
}
