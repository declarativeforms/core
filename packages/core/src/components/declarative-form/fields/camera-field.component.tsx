import { Camera, Loader2, RefreshCw, VideoOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { DeclarativeFieldComponentProps } from "../supporting/field-support";
import type { CompiledCameraField } from "@declarativeforms/runtime";
import { Button } from "@/components/ui/button";
import { useFormI18n } from "../supporting/use-form-i18n";
import { useUploadBlob } from "../supporting/use-upload-blob";
import { cn } from "@/lib/utils";

type CameraState = "idle" | "previewing" | "uploading" | "captured" | "error";

export function CameraField({
  field,
  controllerField,
}: DeclarativeFieldComponentProps) {
  const { t } = useFormI18n();
  const cameraField = field as CompiledCameraField;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<CameraState>(
    controllerField.value ? "captured" : "idle"
  );
  const [capturedUrl, setCapturedUrl] = useState<string | null>(
    (controllerField.value as string) || null
  );
  const {
    upload,
    errorMessage: uploadErrorMessage,
  } = useUploadBlob(controllerField.onChange, "camera.upload_failed");
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const errorMessage = state === "error" ? (cameraErrorMessage ?? uploadErrorMessage) : null;

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const getFacingModeConstraint = (): ConstrainDOMStringParameters | string => {
    const mode = cameraField.facing_mode === "front" ? "user" : "environment";
    return { exact: mode };
  };

  const startCamera = async () => {
    setState("previewing");
    setCameraErrorMessage(null);

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: getFacingModeConstraint() },
        });
      } catch (err) {
        if (err instanceof OverconstrainedError) {
          const mode =
            cameraField.facing_mode === "front" ? "user" : "environment";
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: mode } },
          });
        } else {
          throw err;
        }
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      stopStream();

      let message = t("camera.access_failed");
      if (err instanceof DOMException) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          message = t("camera.permission_denied");
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          message = t("camera.not_found");
        }
      }

      setCameraErrorMessage(message);
      setState("error");
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    stopStream();
    setState("uploading");

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );

    if (!blob) {
      setCameraErrorMessage(t("camera.upload_failed"));
      setState("error");
      return;
    }

    const url = await upload(blob, "camera-capture.png");
    if (url) {
      setCapturedUrl(url);
      setState("captured");
    } else {
      setState("error");
    }
  };

  const retake = () => {
    controllerField.onChange(null);
    setCapturedUrl(null);
    setCameraErrorMessage(null);
    startCamera();
  };

  return (
    <div className="space-y-2">
        <canvas ref={canvasRef} className="hidden" />

        {state === "idle" && (
          <button
            type="button"
            onClick={startCamera}
            className={cn(
              "w-full border border-dashed rounded-md min-h-[160px] cursor-pointer transition-colors",
              "flex flex-col items-center justify-center gap-2 p-6",
              "border-border bg-muted/40 hover:border-ring/60 hover:bg-muted/50",
              "focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
            )}
            aria-label={t("camera.open_camera")}
          >
            <Camera
              className="w-8 h-8 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="text-sm text-foreground">
              {t("camera.open_camera")}
            </span>
          </button>
        )}

        {state === "previewing" && (
          <div className="space-y-2">
            <div
              className={cn(
                "border border-dashed rounded-md overflow-hidden transition-colors",
                "bg-muted/40 border-border"
              )}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-md"
                aria-label={field.label}
              />
            </div>
            <Button type="button" onClick={capturePhoto} className="w-full">
              <Camera className="w-4 h-4 mr-2" aria-hidden="true" />
              {t("camera.capture")}
            </Button>
          </div>
        )}

        {state === "uploading" && (
          <div
            className={cn(
              "border border-dashed rounded-md min-h-[160px] transition-colors",
              "flex flex-col items-center justify-center gap-2 p-6",
              "border-border bg-muted/40"
            )}
          >
            <Loader2
              className="w-8 h-8 text-muted-foreground animate-spin"
              aria-hidden="true"
            />
            <span className="text-sm text-muted-foreground">
              {t("camera.uploading")}
            </span>
          </div>
        )}

        {state === "captured" && capturedUrl && (
          <div className="space-y-2">
            <div
              className={cn(
                "border border-dashed rounded-md overflow-hidden transition-colors",
                "bg-muted/40 border-border"
              )}
            >
              <img
                src={capturedUrl}
                alt={field.label}
                className="w-full rounded-md"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={retake}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              {t("camera.retake")}
            </Button>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-2">
            <div
              className={cn(
                "border border-dashed rounded-md min-h-[160px] transition-colors",
                "flex flex-col items-center justify-center gap-2 p-6",
                "border-destructive/60 bg-destructive/10"
              )}
            >
              <VideoOff
                className="w-8 h-8 text-destructive"
                aria-hidden="true"
              />
              <p className="text-sm text-destructive text-center" aria-live="polite">
                {errorMessage}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={startCamera}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              {t("camera.try_again")}
            </Button>
          </div>
        )}
      </div>
  );
}
