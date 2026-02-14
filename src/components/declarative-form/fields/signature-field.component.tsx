import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { fieldHelperClass } from "../field-styles";
import type { DeclarativeFieldComponentProps } from "../field-contract";
import { FormControl } from "@/components/ui";
import { cn } from "@/lib/utils";

type Point = {
  x: number;
  y: number;
};

const CANVAS_HEIGHT = 160;
const UPLOAD_DEBOUNCE_MS = 500;

export function SignatureField({
  field,
  controllerField,
}: DeclarativeFieldComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const uploadTimeoutRef = useRef<number | null>(null);

  const [hasSignature, setHasSignature] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redrawSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;

    const points = pointsRef.current;
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const { width } = canvas.getBoundingClientRect();

    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(CANVAS_HEIGHT * ratio));
    canvas.style.height = `${CANVAS_HEIGHT}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;

    redrawSignature();
  }, [redrawSignature]);

  useEffect(() => {
    resizeCanvas();
    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resizeCanvas]);

  const getCanvasPoint = (event: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const scheduleUpload = () => {
    if (uploadTimeoutRef.current) {
      window.clearTimeout(uploadTimeoutRef.current);
    }
    uploadTimeoutRef.current = window.setTimeout(() => {
      uploadSignature();
    }, UPLOAD_DEBOUNCE_MS);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(event.nativeEvent);
    if (!point) return;

    if (uploadTimeoutRef.current) {
      window.clearTimeout(uploadTimeoutRef.current);
      uploadTimeoutRef.current = null;
    }

    isDrawingRef.current = true;
    lastPointRef.current = point;
    pointsRef.current.push(point);
    setHasSignature(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const point = getCanvasPoint(event.nativeEvent);
    const lastPoint = lastPointRef.current;
    if (!point || !lastPoint) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPointRef.current = point;
    pointsRef.current.push(point);
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;

    if (hasSignature) {
      scheduleUpload();
    }
  };

  const uploadSignature = async () => {
    if (!canvasRef.current || isUploading || !hasSignature) return;

    setIsUploading(true);
    setErrorMessage(null);

    const canvas = canvasRef.current;
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );

    if (!blob) {
      setErrorMessage("Failed to capture signature.");
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", blob, "signature.png");

    try {
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
      controllerField.onChange(data.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setErrorMessage(message);
    } finally {
      setIsUploading(false);
    }
  };

  const clearSignature = () => {
    if (uploadTimeoutRef.current) {
      window.clearTimeout(uploadTimeoutRef.current);
      uploadTimeoutRef.current = null;
    }

    pointsRef.current = [];
    setHasSignature(false);
    setErrorMessage(null);
    controllerField.onChange(null);
    redrawSignature();
  };

  return (
    <FormControl>
      <div className="space-y-2">
        <div
          className={cn(
            "border-2 border-dashed rounded-md min-h-[160px] transition-colors",
            "bg-muted/40 border-border",
            "focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring"
          )}
        >
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-[160px] touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
              aria-label={field.label}
            />
            {!hasSignature && !isUploading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={fieldHelperClass}>Draw your signature</span>
              </div>
            )}
            {isUploading && (
              <div className="absolute bottom-2 right-3">
                <span className={fieldHelperClass}>Uploading...</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={clearSignature}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
              "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted",
              "transition-colors"
            )}
            disabled={!hasSignature || isUploading}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear
          </button>
        </div>

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}
      </div>
    </FormControl>
  );
}
