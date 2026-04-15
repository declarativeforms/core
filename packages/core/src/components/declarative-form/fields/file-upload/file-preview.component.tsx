import {
  X,
  FileIcon,
  ImageIcon,
  FileTextIcon,
  Loader2,
  FilmIcon,
  MusicIcon,
  FileArchiveIcon,
} from 'lucide-react';

import type { TranslationKey } from '@/i18n/messages/en';
import type { TranslationValues } from '@/i18n/runtime';
import { cn } from '@/lib/utils';

export interface FileMetadata {
  url: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'uploaded' | 'error';
  error?: string;
  progress?: number;
}

export function FilePreview({
  metadata,
  onRemove,
  t,
}: {
  metadata: FileMetadata;
  onRemove: () => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
}) {
  const Icon = (() => {
    if (metadata.type.startsWith('image/')) {
      return ImageIcon;
    }
    if (metadata.type.startsWith('video/')) {
      return FilmIcon;
    }
    if (metadata.type.startsWith('audio/')) {
      return MusicIcon;
    }
    if (
      metadata.type === 'application/pdf' ||
      metadata.type.includes('document') ||
      metadata.type.includes('text')
    ) {
      return FileTextIcon;
    }
    if (metadata.type.includes('zip') || metadata.type.includes('archive')) {
      return FileArchiveIcon;
    }
    return FileIcon;
  })();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const isError = metadata.status === 'error';
  const isUploading = metadata.status === 'uploading';
  const isImage =
    metadata.type.startsWith('image/') && metadata.status === 'uploaded';

  return (
    <div
      role="listitem"
      className={cn(
        'rounded-md flex items-center gap-3 p-3 min-h-[48px]',
        isError
          ? 'border border-destructive/60 bg-destructive/10'
          : 'bg-muted/40 border border-border',
      )}
    >
      {isImage && metadata.url && !metadata.url.startsWith('temp-') ? (
        <div
          className="w-10 h-10 rounded flex-shrink-0 bg-muted bg-cover bg-center"
          style={{ backgroundImage: `url(${metadata.url})` }}
          role="img"
          aria-label={metadata.name}
        />
      ) : (
        <div
          className={cn(
            'w-10 h-10 rounded flex-shrink-0 flex items-center justify-center',
            isError ? 'bg-destructive/15' : 'bg-muted',
          )}
        >
          <Icon
            className={cn(
              'w-5 h-5',
              isError ? 'text-destructive' : 'text-muted-foreground',
            )}
            aria-hidden="true"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium truncate',
            isError ? 'text-destructive' : 'text-foreground',
          )}
        >
          {metadata.name}
        </p>
        {isError && metadata.error ? (
          <p className="text-sm text-destructive" aria-live="polite">
            {metadata.error}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {formatFileSize(metadata.size)}
          </p>
        )}
        {isUploading && (
          <div className="mt-1">
            <div className="w-full bg-muted rounded-full h-1">
              <div
                className="bg-foreground h-1 rounded-full transition-all duration-300"
                style={{ width: `${metadata.progress || 0}%` }}
                role="progressbar"
                aria-valuenow={metadata.progress || 0}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}
      </div>

      {isUploading ? (
        <Loader2
          className="w-5 h-5 text-muted-foreground animate-spin flex-shrink-0"
          aria-label={t('file_upload.uploading')}
        />
      ) : (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'w-8 h-8 rounded flex items-center justify-center flex-shrink-0',
            'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2',
            'transition-colors',
          )}
          aria-label={t('file_upload.remove_file', { name: metadata.name })}
        >
          <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
