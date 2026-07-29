import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { fetchWithTimeout } from './fetch-with-timeout';

export type RendererApi = {
  formId: string;
  getUrl(path: string): string;
  pendingUploads: number;
  uploadFile(
    file: File | Blob,
    filename?: string,
    fieldId?: string,
  ): Promise<string>;
};

const RendererApiContext = createContext<RendererApi | null>(null);

export function RendererApiProvider(props: {
  apiBaseUrl?: string;
  children: ReactNode;
  formId?: string;
}) {
  const uploadTokenRef = useRef('');
  const [pendingUploads, setPendingUploads] = useState(0);

  const api = useMemo<RendererApi>(() => {
    const baseUrl = (props.apiBaseUrl ?? '/api/v1').replace(/\/$/, '');
    const formId = props.formId ?? '';
    const getUrl = (path: string) => `${baseUrl}/${path.replace(/^\//, '')}`;

    return {
      formId,
      getUrl,
      pendingUploads,
      async uploadFile(
        file: File | Blob,
        filename?: string,
        fieldId?: string,
      ): Promise<string> {
        if (!formId) {
          throw new Error('A form ID is required to upload files.');
        }

        setPendingUploads((count) => count + 1);

        try {
          if (!uploadTokenRef.current) {
            const capabilityResponse = await fetchWithTimeout(
              getUrl(`forms/${encodeURIComponent(formId)}/upload-capabilities`),
              { method: 'POST' },
            );
            if (!capabilityResponse.ok) {
              throw new Error('File uploads are not available for this form.');
            }
            const capability = (await capabilityResponse.json()) as {
              token?: string;
            };
            if (!capability.token) {
              throw new Error('The upload capability response was invalid.');
            }
            uploadTokenRef.current = capability.token;
          }

          const formData = new FormData();
          formData.append('file', file, filename);
          const response = await fetchWithTimeout(getUrl('files/upload'), {
            body: formData,
            headers: {
              Authorization: `Bearer ${uploadTokenRef.current}`,
              ...(fieldId ? { 'X-Field-Id': fieldId } : {}),
              'X-Form-Id': formId,
            },
            method: 'POST',
          });

          if (!response.ok) {
            if (response.status === 401) {
              uploadTokenRef.current = '';
            }
            const error = (await response.json().catch(() => ({}))) as {
              error?: { message?: string } | string;
            };
            const message =
              typeof error.error === 'string'
                ? error.error
                : error.error?.message;
            throw new Error(message || 'Upload failed');
          }

          const payload = (await response.json()) as { url?: string };
          if (!payload.url) {
            throw new Error('The upload response did not include a URL.');
          }
          return payload.url;
        } finally {
          setPendingUploads((count) => Math.max(0, count - 1));
        }
      },
    };
  }, [pendingUploads, props.apiBaseUrl, props.formId]);

  return (
    <RendererApiContext.Provider value={api}>
      {props.children}
    </RendererApiContext.Provider>
  );
}

export function useRendererApi(): RendererApi {
  const api = useContext(RendererApiContext);
  if (!api) {
    throw new Error('useRendererApi must be used inside RendererApiProvider.');
  }
  return api;
}
