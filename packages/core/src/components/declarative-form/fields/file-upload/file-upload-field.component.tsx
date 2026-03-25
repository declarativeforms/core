import { Upload } from "lucide-react";
import { useState, useRef } from "react";

import type { DeclarativeFieldComponentProps } from "../../supporting/field-support";
import { buildFieldValidation } from "../../supporting/validation";
import { FormControl } from "@/components/ui";
import { useFormI18n } from "../../supporting/use-form-i18n";
import { uploadFile } from "@/lib/file-upload";
import { cn } from "@/lib/utils";
import { FilePreview, type FileMetadata } from "./file-preview.component";

export function FileUploadField({
  field,
  controllerField,
}: DeclarativeFieldComponentProps) {
  const { t } = useFormI18n();
  const [isDragging, setIsDragging] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { minBound, maxBound } = buildFieldValidation(field);
  const maxFiles = maxBound ?? 1;

  const currentUrls: string[] = Array.isArray(controllerField.value)
    ? controllerField.value.filter(
        (value): value is string => typeof value === "string" && value.length > 0
      )
    : typeof controllerField.value === "string" && controllerField.value
      ? [controllerField.value]
      : [];

  const validateFile = (): string | null => {
    if (fileMetadata.length >= maxFiles) {
      return t("file_upload.max_reached", { max: String(maxFiles) });
    }

    return null;
  };

  const handleFiles = async (newFiles: File[]) => {
    const error = validateFile();
    if (error) {
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
    const minFiles = minBound ?? 0;

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
          required={field.required}
          aria-required={field.required}
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
