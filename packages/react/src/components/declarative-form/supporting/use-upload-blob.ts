import { useCallback, useState } from 'react';

import type { TranslationKey } from '../../../i18n/messages/en';
import { useRendererApi } from '../../../lib/renderer-api';

import { useFormI18n } from './use-form-i18n';

export function useUploadBlob(
  onChange: (value: string | null) => void,
  fallbackErrorKey: TranslationKey,
  fieldId: string,
) {
  const { t } = useFormI18n();
  const { uploadFile } = useRendererApi();
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const upload = useCallback(
    async (blob: Blob, filename: string): Promise<string | null> => {
      setIsUploading(true);
      setErrorMessage(null);
      try {
        const url = await uploadFile(blob, filename, fieldId);
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
    [fieldId, onChange, t, fallbackErrorKey, uploadFile],
  );

  return { upload, isUploading, errorMessage, setErrorMessage };
}
