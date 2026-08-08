import { useCallback, useState } from 'react';

import type { TranslationKey } from '@/i18n/messages/en';
import { uploadFile } from '@/lib/file-upload';

import { useI18n } from '@/i18n';

export function useUploadBlob(
  onChange: (value: string | null) => void,
  fallbackErrorKey: TranslationKey,
) {
  const { t } = useI18n();
  // TODO: if possible replace all the useState, useCallback with a single useQuery for this useUploadBlob hook
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const upload = useCallback(
    async (blob: Blob, filename: string): Promise<string | null> => {
      setIsUploading(true);
      setErrorMessage(null);
      try {
        const url = await uploadFile(blob, filename);
        onChange(url);
        return url;
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : t(fallbackErrorKey);
        setErrorMessage(msg);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, t, fallbackErrorKey],
  );

  return { upload, isUploading, errorMessage, setErrorMessage };
}
