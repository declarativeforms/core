'use client';

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

import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import type { UploadedFile } from './use-file-uploads';

function FileTypeIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  if (type.startsWith('image/')) {
    return <ImageIcon className={className} aria-hidden="true" />;
  }
  if (type.startsWith('video/')) {
    return <FilmIcon className={className} aria-hidden="true" />;
  }
  if (type.startsWith('audio/')) {
    return <MusicIcon className={className} aria-hidden="true" />;
  }
  if (
    type === 'application/pdf' ||
    type.includes('document') ||
    type.includes('text')
  ) {
    return <FileTextIcon className={className} aria-hidden="true" />;
  }
  if (type.includes('zip') || type.includes('archive')) {
    return <FileArchiveIcon className={className} aria-hidden="true" />;
  }
  return <FileIcon className={className} aria-hidden="true" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function FilePreview({
  file,
  onRemove,
}: {
  file: UploadedFile;
  onRemove: () => void;
}) {
  const { t } = useI18n();

  const isError = file.status === 'error';
  const isUploading = file.status === 'uploading';
  const thumbnail =
    file.status === 'uploaded' && file.url && file.type.startsWith('image/')
      ? file.url
      : null;

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
      {thumbnail ? (
        <div
          className="w-10 h-10 rounded flex-shrink-0 bg-muted bg-cover bg-center"
          style={{ backgroundImage: `url("${encodeURI(thumbnail)}")` }}
          role="img"
          aria-label={file.name}
        />
      ) : (
        <div
          className={cn(
            'w-10 h-10 rounded flex-shrink-0 flex items-center justify-center',
            isError ? 'bg-destructive/15' : 'bg-muted',
          )}
        >
          <FileTypeIcon
            type={file.type}
            className={cn(
              'w-5 h-5',
              isError ? 'text-destructive' : 'text-muted-foreground',
            )}
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
          {file.name}
        </p>
        {isError && file.error ? (
          <p className="text-sm text-destructive" aria-live="polite">
            {file.error}
          </p>
        ) : file.size !== undefined ? (
          <p className="text-sm text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        ) : null}
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
          aria-label={t('file_upload.remove_file', { name: file.name })}
        >
          <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
