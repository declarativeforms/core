'use client';

import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import type { IRenderableFileUploadField } from '@declarativeforms/engine';

import { useI18n } from '@/i18n';
import { stripHtml } from '@/lib/strip-html';
import { cn } from '@/lib/utils';
import type { FieldProps } from '../../supporting/field.types';
import { mediaFrame } from '../../supporting/media-frame';
import { FilePreview } from './file-preview.component';
import { useFileUploads } from './use-file-uploads';

type FileUploadValue = string | string[] | null;

export function FileUploadField({
  field,
  control,
}: FieldProps<IRenderableFileUploadField, FileUploadValue>) {
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedMimeTypesLabel = field.acceptedMimeTypes.join(', ');
  const minFiles = field.min ?? 0;
  const maxFiles = field.max ?? 1;

  const uploads = useFileUploads({
    value: control.value,
    onChange: control.onChange,
    acceptedMimeTypes: field.acceptedMimeTypes,
    maxFiles,
    storesScalar: field.storesScalar,
    messages: {
      maxReached: (max) => t('file_upload.max_reached', { max: String(max) }),
      invalidType: () =>
        t('file_upload.invalid_type', { types: acceptedMimeTypesLabel }),
      uploadFailed: () => t('file_upload.upload_failed'),
    },
  });

  const requirements = [
    minFiles > 0 && maxFiles > minFiles
      ? t('file_upload.range_files', {
          min: String(minFiles),
          max: String(maxFiles),
        })
      : minFiles > 0
        ? t('file_upload.at_least_files', { min: String(minFiles) })
        : maxFiles > 1
          ? t('file_upload.up_to_files', { max: String(maxFiles) })
          : '',
    field.acceptedMimeTypes.length > 0
      ? t('file_upload.accepted_types', { types: acceptedMimeTypesLabel })
      : '',
  ]
    .filter(Boolean)
    .join(' • ');

  const openPicker = () => fileInputRef.current?.click();

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedMimeTypesLabel || undefined}
        multiple={maxFiles > 1}
        onChange={(event) => {
          uploads.add(Array.from(event.target.files || []));
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        className="sr-only"
        id={control.name}
        aria-label={stripHtml(field.label)}
        required={field.required}
        aria-required={field.required}
      />

      {uploads.canAddMore && (
        <div
          onClick={openPicker}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            uploads.add(Array.from(event.dataTransfer.files));
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openPicker();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={t('file_upload.upload_files')}
          className={cn(
            mediaFrame({
              height: 'sm',
              interactive: true,
              tone: isDragging ? 'active' : 'default',
            }),
            'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring',
          )}
        >
          <Upload className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
          <div className="text-center">
            <p className="text-sm text-foreground">
              {t('file_upload.click_to_upload')}
            </p>
            {requirements && (
              <p className="mt-1 text-sm text-muted-foreground">{requirements}</p>
            )}
            {field.placeholder && (
              <p className="mt-1 text-sm text-muted-foreground">
                {field.placeholder}
              </p>
            )}
          </div>
        </div>
      )}

      {uploads.files.length > 0 && (
        <div
          className="space-y-2"
          role="list"
          aria-label={t('file_upload.uploaded_files')}
          aria-live="polite"
          aria-busy={uploads.isUploading}
        >
          {uploads.files.map((file) => (
            <FilePreview
              key={file.id}
              file={file}
              onRemove={() => uploads.remove(file.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
