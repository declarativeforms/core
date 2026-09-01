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

function FileTypeIcon(props: { type: string; className?: string }) {
  if (props.type.startsWith('image/')) {
    return <ImageIcon className={props.className} aria-hidden="true" />;
  }

  if (props.type.startsWith('video/')) {
    return <FilmIcon className={props.className} aria-hidden="true" />;
  }

  if (props.type.startsWith('audio/')) {
    return <MusicIcon className={props.className} aria-hidden="true" />;
  }

  if (
    props.type === 'application/pdf' ||
    props.type.includes('document') ||
    props.type.includes('text')
  ) {
    return <FileTextIcon className={props.className} aria-hidden="true" />;
  }

  if (props.type.includes('zip') || props.type.includes('archive')) {
    return <FileArchiveIcon className={props.className} aria-hidden="true" />;
  }

  return <FileIcon className={props.className} aria-hidden="true" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function FilePreview(props: {
  file: UploadedFile;
  onRemove: () => void;
}) {
  const i18n = useI18n();

  const isError = props.file.status === 'error';
  const isUploading = props.file.status === 'uploading';
  const thumbnail =
    props.file.status === 'uploaded' &&
    props.file.url &&
    props.file.type.startsWith('image/')
      ? props.file.url
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
          aria-label={props.file.name}
        />
      ) : (
        <div
          className={cn(
            'w-10 h-10 rounded flex-shrink-0 flex items-center justify-center',
            isError ? 'bg-destructive/15' : 'bg-muted',
          )}
        >
          <FileTypeIcon
            type={props.file.type}
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
          {props.file.name}
        </p>
        {isError && props.file.error ? (
          <p className="text-sm text-destructive" aria-live="polite">
            {props.file.error}
          </p>
        ) : props.file.size !== undefined ? (
          <p className="text-sm text-muted-foreground">
            {formatFileSize(props.file.size)}
          </p>
        ) : null}
      </div>

      {isUploading ? (
        <Loader2
          className="w-5 h-5 text-muted-foreground animate-spin flex-shrink-0"
          aria-label={i18n.t('file_upload.uploading')}
        />
      ) : (
        <button
          type="button"
          onClick={props.onRemove}
          className={cn(
            'w-8 h-8 rounded flex items-center justify-center flex-shrink-0',
            'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2',
            'transition-colors',
          )}
          aria-label={i18n.t('file_upload.remove_file', {
            name: props.file.name,
          })}
        >
          <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
