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

import type { DeclarativeFieldComponentProps } from "../field-contract";
import { FormControl } from "@/components/ui";
import { useI18n } from "@/i18n/use-i18n";
import type { TranslationKey } from "@/i18n/messages/en";
import type { TranslationValues } from "@/i18n/runtime";
import { cn } from "@/lib/utils";

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
  controllerField,
  meta,
}: DeclarativeFieldComponentProps) {
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFiles =
    typeof meta.maxValidator?.value === "number" ? meta.maxValidator.value : 1;

  const currentUrls: string[] =
    maxFiles === 1
      ? controllerField.value
        ? [controllerField.value]
        : []
      : controllerField.value || [];

  const validateFile = (): string | null => {
    // Check max files
    if (fileMetadata.length >= maxFiles) {
      return t("file_upload.max_reached", { max: String(maxFiles) });
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
        .catch(() => ({ error: t("file_upload.upload_failed") }));
      throw new Error(error.error || t("file_upload.upload_failed"));
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
        controllerField.onChange(newUrls);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t("file_upload.upload_failed");
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
    controllerField.onChange(newUrls);
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
    const requirements: string[] = [];
    const minFiles =
      typeof meta.minValidator?.value === "number"
        ? meta.minValidator.value
        : 0;

    if (minFiles > 0 && maxFiles > minFiles) {
      requirements.push(t("file_upload.range_files", { min: String(minFiles), max: String(maxFiles) }));
    } else if (minFiles > 0) {
      requirements.push(t("file_upload.at_least_files", { min: String(minFiles) }));
    } else if (maxFiles > 1) {
      requirements.push(t("file_upload.up_to_files", { max: String(maxFiles) }));
    }

    return requirements.join(" • ");
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
          id={controllerField.name}
          aria-label={field.label}
          required={meta.isRequired}
          aria-required={meta.isRequired}
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
            aria-label={t("file_upload.upload_files")}
            className={cn(
              "border border-dashed rounded-md min-h-[120px] cursor-pointer transition-colors",
              "flex flex-col items-center justify-center gap-2 p-6",
              "focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring",
              isDragging
                ? "border-ring bg-muted/60"
                : "border-border bg-muted/40 hover:border-ring/60 hover:bg-muted/50"
            )}
          >
            <Upload
              className="w-8 h-8 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="text-center">
              <p className="text-sm text-foreground">
                {t("file_upload.click_to_upload")}
              </p>
              {getFileRequirements() && (
                <p className="mt-1 text-sm text-muted-foreground">{getFileRequirements()}</p>
              )}
              {field.placeholder && <p className="mt-1 text-sm text-muted-foreground">{field.placeholder}</p>}
            </div>
          </div>
        )}

        {fileMetadata.length > 0 && (
          <div className="space-y-2" role="list" aria-label={t("file_upload.uploaded_files")} aria-live="polite" aria-busy={fileMetadata.some((m) => m.status === "uploading")}>
            {fileMetadata.map((metadata, index) => (
              <FilePreview
                key={metadata.url || index}
                metadata={metadata}
                onRemove={() => handleRemove(metadata.url)}
                t={t}
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
  t,
}: {
  metadata: FileMetadata;
  onRemove: () => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
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
          ? "border border-destructive/60 bg-destructive/10"
          : "bg-muted/40 border border-border"
      )}
    >
      {isImage && metadata.url && !metadata.url.startsWith("temp-") ? (
        <div
          className="w-10 h-10 rounded flex-shrink-0 bg-muted bg-cover bg-center"
          style={{ backgroundImage: `url(${metadata.url})` }}
          role="img"
          aria-label={metadata.name}
        />
      ) : (
        <div
          className={cn(
            "w-10 h-10 rounded flex-shrink-0 flex items-center justify-center",
            isError ? "bg-destructive/15" : "bg-muted"
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5",
              isError ? "text-destructive" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            isError ? "text-destructive" : "text-foreground"
          )}
        >
          {metadata.name}
        </p>
        {isError && metadata.error ? (
          <p className="text-sm text-destructive" aria-live="polite">{metadata.error}</p>
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
          aria-label={t("file_upload.uploading")}
        />
      ) : (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            "w-8 h-8 rounded flex items-center justify-center flex-shrink-0",
            "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2",
            "transition-colors"
          )}
          aria-label={t("file_upload.remove_file", { name: metadata.name })}
        >
          <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
