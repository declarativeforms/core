'use client';
import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import type { IRenderableFileUploadField } from '@declarativeforms/engine';
import { useI18n } from '@/i18n';
import { stripHtml } from '@/lib/strip-html';
import { cn } from '@/lib/utils';
import {
  mediaFrame,
  type FieldProps,
} from '@/components/declarative-form/supporting';
import { FilePreview } from './file-preview.component';
import { useFileUploads } from './use-file-uploads';

type FileUploadValue = string | Array<string> | null;

export function FileUploadField(
  props: FieldProps<IRenderableFileUploadField, FileUploadValue>,
) {
  const i18n = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedMimeTypesLabel = props.field.acceptedMimeTypes.join(', ');
  const minFiles = props.field.min ?? 0;
  const maxFiles = props.field.max ?? 1;

  const uploads = useFileUploads({
    value: props.control.value,
    onChange: props.control.onChange,
    acceptedMimeTypes: props.field.acceptedMimeTypes,
    maxFiles,
    storesScalar: props.field.storesScalar,
    messages: {
      maxReached: (max) =>
        i18n.t('file_upload.max_reached', { max: String(max) }),
      invalidType: () =>
        i18n.t('file_upload.invalid_type', { types: acceptedMimeTypesLabel }),
      uploadFailed: () => i18n.t('file_upload.upload_failed'),
    },
  });

  const requirements = [
    minFiles > 0 && maxFiles > minFiles
      ? i18n.t('file_upload.range_files', {
          min: String(minFiles),
          max: String(maxFiles),
        })
      : minFiles > 0
        ? i18n.t('file_upload.at_least_files', { min: String(minFiles) })
        : maxFiles > 1
          ? i18n.t('file_upload.up_to_files', { max: String(maxFiles) })
          : '',
    props.field.acceptedMimeTypes.length > 0
      ? i18n.t('file_upload.accepted_types', { types: acceptedMimeTypesLabel })
      : '',
  ]
    .filter(Boolean)
    .join(' • ');

  const openPicker = (): void => fileInputRef.current?.click();

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
        id={props.control.name}
        aria-label={stripHtml(props.field.label)}
        required={props.field.required}
        aria-required={props.field.required}
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
          aria-label={i18n.t('file_upload.upload_files')}
          className={cn(
            mediaFrame({
              height: 'sm',
              interactive: true,
              tone: isDragging ? 'active' : 'default',
            }),
            'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring',
          )}
        >
          <Upload
            className="w-8 h-8 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="text-center">
            <p className="text-sm text-foreground">
              {i18n.t('file_upload.click_to_upload')}
            </p>
            {requirements && (
              <p className="mt-1 text-sm text-muted-foreground">
                {requirements}
              </p>
            )}
            {props.field.placeholder && (
              <p className="mt-1 text-sm text-muted-foreground">
                {props.field.placeholder}
              </p>
            )}
          </div>
        </div>
      )}

      {uploads.files.length > 0 && (
        <div
          className="space-y-2"
          role="list"
          aria-label={i18n.t('file_upload.uploaded_files')}
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
