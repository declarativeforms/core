import {
  Upload,
  X,
  FileIcon,
  ImageIcon,
  FileTextIcon,
  Loader2,
  FilmIcon,
  MusicIcon,
  FileArchiveIcon,
} from "lucide-react";
import { useState, useRef } from "react";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import { FormControl } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { IDeclarativeFormField } from "../types";

interface FileMetadata {
  url: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "uploaded" | "error";
  error?: string;
  progress?: number;
}

export function FileUploadField({
  field,
  formField,
}: {
  field: IDeclarativeFormField;
  formField: ControllerRenderProps<FieldValues, string>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFiles = field.max ?? 1;

  const currentUrls: string[] =
    maxFiles === 1
      ? formField.value
        ? [formField.value]
        : []
      : formField.value || [];

  const validateFile = (): string | null => {
    // Check max files
    if (fileMetadata.length >= maxFiles) {
      return `Maximum number of files (${maxFiles}) reached`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      "https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/files/upload",
      {
        body: formData,
        method: "POST",
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Upload failed" }));
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data.url;
  };

  const handleFiles = async (newFiles: File[]) => {
    // Check if adding these files would exceed max
    const error = validateFile();
    if (error) {
      // Show error for all files
      for (const file of newFiles) {
        const metadata: FileMetadata = {
          url: "",
          name: file.name,
          size: file.size,
          type: file.type,
          status: "error",
          error,
        };
        setFileMetadata((prev) => [...prev, metadata]);
      }
      return;
    }

    for (const file of newFiles) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const metadata: FileMetadata = {
        url: tempId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
        progress: 0,
      };

      setFileMetadata((prev) => [...prev, metadata]);

      try {
        const url = await uploadFile(file);

        setFileMetadata((prev) =>
          prev.map((m) =>
            m.url === tempId ? { ...m, url, status: "uploaded" as const } : m
          )
        );

        const newUrls = maxFiles === 1 ? url : [...currentUrls, url];
        formField.onChange(newUrls);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        setFileMetadata((prev) =>
          prev.map((m) =>
            m.url === tempId
              ? { ...m, status: "error" as const, error: errorMessage }
              : m
          )
        );
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = (url: string) => {
    setFileMetadata((prev) => prev.filter((m) => m.url !== url));

    const newUrls =
      maxFiles === 1 ? null : currentUrls.filter((u) => u !== url);
    formField.onChange(newUrls);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const canAddMore = fileMetadata.length < maxFiles;

  const getFileRequirements = () => {
    if (maxFiles > 1) {
      return `Up to ${maxFiles} files`;
    }
    return "";
  };

  return (
    <FormControl>
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          onChange={handleInputChange}
          className="sr-only"
          id={formField.name}
          aria-label={field.label}
        />

        {canAddMore && (
          <div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Upload files"
            className={cn(
              "border-2 border-dashed rounded-md min-h-[120px] cursor-pointer transition-colors",
              "flex flex-col items-center justify-center gap-2 p-6",
              "focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2",
              isDragging
                ? "border-gray-900 bg-gray-100"
                : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
            )}
          >
            <Upload className="w-8 h-8 text-gray-400" aria-hidden="true" />
            <div className="text-center">
              <p className="text-base text-gray-900">
                Click to upload or drag and drop
              </p>
              {getFileRequirements() && (
                <p className="text-sm text-gray-500 mt-1">
                  {getFileRequirements()}
                </p>
              )}
              {field.placeholder && (
                <p className="text-sm text-gray-500 mt-1">
                  {field.placeholder}
                </p>
              )}
            </div>
          </div>
        )}

        {fileMetadata.length > 0 && (
          <div className="space-y-2" role="list" aria-label="Uploaded files">
            {fileMetadata.map((metadata, index) => (
              <FilePreview
                key={metadata.url || index}
                metadata={metadata}
                onRemove={() => handleRemove(metadata.url)}
              />
            ))}
          </div>
        )}
      </div>
    </FormControl>
  );
}

function FilePreview({
  metadata,
  onRemove,
}: {
  metadata: FileMetadata;
  onRemove: () => void;
}) {
  const Icon = (() => {
    if (metadata.type.startsWith("image/")) {
      return ImageIcon;
    }
    if (metadata.type.startsWith("video/")) {
      return FilmIcon;
    }
    if (metadata.type.startsWith("audio/")) {
      return MusicIcon;
    }
    if (
      metadata.type === "application/pdf" ||
      metadata.type.includes("document") ||
      metadata.type.includes("text")
    ) {
      return FileTextIcon;
    }
    if (metadata.type.includes("zip") || metadata.type.includes("archive")) {
      return FileArchiveIcon;
    }
    return FileIcon;
  })();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const isError = metadata.status === "error";
  const isUploading = metadata.status === "uploading";
  const isImage =
    metadata.type.startsWith("image/") && metadata.status === "uploaded";

  return (
    <div
      role="listitem"
      className={cn(
        "rounded-md flex items-center gap-3 p-3 min-h-[48px]",
        isError
          ? "border border-red-500 bg-red-50"
          : "bg-gray-50 border border-gray-200"
      )}
    >
      {isImage && metadata.url && !metadata.url.startsWith("temp-") ? (
        <div
          className="w-10 h-10 rounded flex-shrink-0 bg-gray-200 bg-cover bg-center"
          style={{ backgroundImage: `url(${metadata.url})` }}
          role="img"
          aria-label={metadata.name}
        />
      ) : (
        <div
          className={cn(
            "w-10 h-10 rounded flex-shrink-0 flex items-center justify-center",
            isError ? "bg-red-100" : "bg-gray-100"
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5",
              isError ? "text-red-500" : "text-gray-500"
            )}
            aria-hidden="true"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            isError ? "text-red-900" : "text-gray-900"
          )}
        >
          {metadata.name}
        </p>
        {isError && metadata.error ? (
          <p className="text-sm text-red-600">{metadata.error}</p>
        ) : (
          <p className="text-sm text-gray-500">
            {formatFileSize(metadata.size)}
          </p>
        )}
        {isUploading && (
          <div className="mt-1">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-gray-900 h-1 rounded-full transition-all duration-300"
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
          className="w-5 h-5 text-gray-400 animate-spin flex-shrink-0"
          aria-label="Uploading"
        />
      ) : (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            "w-8 h-8 rounded flex items-center justify-center flex-shrink-0",
            "hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2",
            "transition-colors"
          )}
          aria-label={`Remove ${metadata.name}`}
        >
          <X className="w-4 h-4 text-gray-500" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
