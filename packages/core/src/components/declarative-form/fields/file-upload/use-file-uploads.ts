'use client';
import { useRef, useState } from 'react';
import type { IUploadedFile } from '@declarativeforms/engine';
import { uploadFile } from '@/lib/file-upload';

export type UploadedFile = {
  id: string;
  url: string | null;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'uploaded' | 'error';
  error?: string;
};

export type UploadMessages = {
  maxReached: (max: number) => string;
  invalidType: () => string;
  uploadFailed: () => string;
};

function acceptsMimeType(
  file: File,
  acceptedMimeTypes: Array<string>,
): boolean {
  if (acceptedMimeTypes.length === 0) {
    return true;
  }

  return acceptedMimeTypes.some((acceptedType) => {
    const normalized = acceptedType.trim().toLowerCase();

    if (!normalized || !file.type) {
      return false;
    }

    if (normalized.endsWith('/*')) {
      const prefix = normalized.slice(0, normalized.length - 1);

      return file.type.toLowerCase().startsWith(prefix);
    }

    return file.type.toLowerCase() === normalized;
  });
}

function toUploadedFileArray(
  uploadedFiles: IUploadedFile | Array<IUploadedFile> | null,
): Array<IUploadedFile> {
  if (Array.isArray(uploadedFiles)) {
    return uploadedFiles;
  }

  return uploadedFiles ? [uploadedFiles] : [];
}

function toRestoredFile(uploadedFile: IUploadedFile): UploadedFile {
  return {
    id: uploadedFile.url,
    url: uploadedFile.url,
    name: uploadedFile.name,
    size: uploadedFile.size,
    type: uploadedFile.type,
    status: 'uploaded',
  };
}

function findAllOccupiedFiles(files: Array<UploadedFile>): Array<UploadedFile> {
  return files.filter((file) => file.status !== 'error');
}

function toCompletedUploads(files: Array<UploadedFile>): Array<IUploadedFile> {
  return files
    .filter((file) => file.status === 'uploaded' && !!file.url)
    .map((file) => ({
      url: file.url as string,
      name: file.name,
      size: file.size,
      type: file.type,
    }));
}

export type FileUploads = {
  files: Array<UploadedFile>;
  add: (incoming: Array<File>) => Promise<void>;
  remove: (id: string) => void;
  canAddMore: boolean;
  isUploading: boolean;
};

export function useFileUploads(options: {
  value: IUploadedFile | Array<IUploadedFile> | null;
  onChange: (value: IUploadedFile | Array<IUploadedFile> | null) => void;
  acceptedMimeTypes: Array<string>;
  maxFiles: number;
  storesScalar: boolean;
  messages: UploadMessages;
}): FileUploads {
  const [files, setFiles] = useState<Array<UploadedFile>>(() =>
    toUploadedFileArray(options.value).map(toRestoredFile),
  );

  const filesRef = useRef(files);
  const nextIdRef = useRef(0);

  function getNextFileId(prefix: string): string {
    nextIdRef.current += 1;

    return `${prefix}-${nextIdRef.current}`;
  }

  function replaceFiles(nextFiles: Array<UploadedFile>): void {
    const before = toCompletedUploads(filesRef.current);
    const after = toCompletedUploads(nextFiles);

    filesRef.current = nextFiles;
    setFiles(nextFiles);

    const unchanged =
      before.length === after.length &&
      before.every((file, index) => file.url === after[index].url);

    if (unchanged) {
      return;
    }

    options.onChange(options.storesScalar ? (after[0] ?? null) : after);
  }

  function updateFile(id: string, changes: Partial<UploadedFile>): void {
    replaceFiles(
      filesRef.current.map((file) =>
        file.id === id ? { ...file, ...changes } : file,
      ),
    );
  }

  async function add(incomingFiles: Array<File>): Promise<void> {
    let slots =
      options.maxFiles - findAllOccupiedFiles(filesRef.current).length;
    const queued: Array<{ file: File; id: string }> = [];
    const entries: Array<UploadedFile> = [];

    for (const file of incomingFiles) {
      const rejection = !acceptsMimeType(file, options.acceptedMimeTypes)
        ? options.messages.invalidType()
        : slots <= 0
          ? options.messages.maxReached(options.maxFiles)
          : null;

      if (rejection) {
        entries.push({
          id: getNextFileId('rejected'),
          url: null,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'error',
          error: rejection,
        });
        continue;
      }

      slots -= 1;
      const id = getNextFileId('pending');
      queued.push({ file, id });
      entries.push({
        id,
        url: null,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
      });
    }

    replaceFiles([...filesRef.current, ...entries]);

    for (const entry of queued) {
      try {
        const uploadedFile = await uploadFile(entry.file);

        updateFile(entry.id, {
          ...uploadedFile,
          status: 'uploaded',
        });
      } catch (error) {
        updateFile(entry.id, {
          status: 'error',
          error:
            error instanceof Error
              ? error.message
              : options.messages.uploadFailed(),
        });
      }
    }
  }

  function remove(id: string): void {
    replaceFiles(filesRef.current.filter((file) => file.id !== id));
  }

  return {
    files,
    add,
    remove,
    canAddMore: findAllOccupiedFiles(files).length < options.maxFiles,
    isUploading: files.some((file) => file.status === 'uploading'),
  };
}
