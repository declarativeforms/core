'use client';

import { useRef, useState } from 'react';

import { uploadFile } from '@/lib/file-upload';

export type UploadedFile = {
  /** Stable list key. Also the stored URL once the upload has landed. */
  id: string;
  url: string | null;
  name: string;
  /** Unknown for files restored from a submission: only the URL was stored. */
  size?: number;
  type: string;
  status: 'uploading' | 'uploaded' | 'error';
  error?: string;
};

export type UploadMessages = {
  maxReached: (max: number) => string;
  invalidType: () => string;
  uploadFailed: () => string;
};

function acceptsMimeType(file: File, acceptedMimeTypes: string[]) {
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

function toUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (entry): entry is string => typeof entry === 'string' && entry.length > 0,
    );
  }
  return typeof value === 'string' && value ? [value] : [];
}

const EXTENSION_MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

// Rebuild a list entry for an already-uploaded file (e.g. a restored
// submission), where only the stored URL is known.
function restoredFile(url: string): UploadedFile {
  const name = decodeURIComponent(url.split('/').pop() || url);
  const extension = name.split('.').pop()?.toLowerCase() ?? '';

  return {
    id: url,
    url,
    name,
    type: EXTENSION_MIME_TYPES[extension] ?? '',
    status: 'uploaded',
  };
}

/** Entries that hold, or are about to hold, an answer. Errors are just notices. */
function occupied(files: UploadedFile[]): UploadedFile[] {
  return files.filter((file) => file.status !== 'error');
}

function uploadedUrls(files: UploadedFile[]): string[] {
  return files
    .filter((file) => file.status === 'uploaded' && !!file.url)
    .map((file) => file.url as string);
}

/**
 * The upload list behind a `file_upload` field: which files are shown, which
 * are still in flight, and what the field's answer is.
 *
 * The answer is always derived from the list rather than tracked alongside it,
 * so a batch of files dropped at once cannot race: each upload settles its own
 * entry, and the whole list is what gets committed.
 */
export function useFileUploads(options: {
  value: unknown;
  onChange: (value: string | string[] | null) => void;
  acceptedMimeTypes: string[];
  maxFiles: number;
  storesScalar: boolean;
  messages: UploadMessages;
}) {
  const { acceptedMimeTypes, maxFiles, messages, onChange, storesScalar } =
    options;

  const [files, setFiles] = useState<UploadedFile[]>(() =>
    toUrls(options.value).map(restoredFile),
  );

  // The list is also held in a ref so a batch of uploads settling one after
  // another always reads the latest entries, not the render they started in.
  const filesRef = useRef(files);
  const nextIdRef = useRef(0);

  function nextId(prefix: string) {
    nextIdRef.current += 1;
    return `${prefix}-${nextIdRef.current}`;
  }

  function write(next: UploadedFile[]) {
    const before = uploadedUrls(filesRef.current);
    const after = uploadedUrls(next);

    filesRef.current = next;
    setFiles(next);

    const unchanged =
      before.length === after.length &&
      before.every((url, index) => url === after[index]);

    if (unchanged) {
      return;
    }
    onChange(storesScalar ? (after[0] ?? null) : after);
  }

  function settle(id: string, entry: Partial<UploadedFile>) {
    write(
      filesRef.current.map((file) =>
        file.id === id ? { ...file, ...entry } : file,
      ),
    );
  }

  async function add(incoming: File[]) {
    // Classify the whole batch up front, counting free slots as they are taken,
    // so one drop of many files cannot exceed `max`.
    let slots = maxFiles - occupied(filesRef.current).length;
    const queued: Array<{ file: File; id: string }> = [];
    const entries: UploadedFile[] = [];

    for (const file of incoming) {
      const rejection = !acceptsMimeType(file, acceptedMimeTypes)
        ? messages.invalidType()
        : slots <= 0
          ? messages.maxReached(maxFiles)
          : null;

      if (rejection) {
        entries.push({
          id: nextId('rejected'),
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
      const id = nextId('pending');
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

    write([...filesRef.current, ...entries]);

    for (const { file, id } of queued) {
      try {
        settle(id, { url: await uploadFile(file), status: 'uploaded' });
      } catch (error) {
        settle(id, {
          status: 'error',
          error: error instanceof Error ? error.message : messages.uploadFailed(),
        });
      }
    }
  }

  function remove(id: string) {
    write(filesRef.current.filter((file) => file.id !== id));
  }

  return {
    files,
    add,
    remove,
    canAddMore: occupied(files).length < maxFiles,
    isUploading: files.some((file) => file.status === 'uploading'),
  };
}
