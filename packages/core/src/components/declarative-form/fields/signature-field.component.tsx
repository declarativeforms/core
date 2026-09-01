'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { IRenderableSignatureField } from '@declarativeforms/engine';

import { useI18n } from '@/i18n';
import { stripHtml } from '@/lib/strip-html';
import { ClearButton } from '../supporting/clear-button.component';
import type { FieldProps } from '../supporting/field.types';
import { mediaFrame } from '../supporting/media-frame';
import { canvasToPngBlob, useUploadBlob } from './use-upload-blob';

type Point = { x: number; y: number };
type Stroke = Array<Point>;

const CANVAS_HEIGHT = 160;
const UPLOAD_DEBOUNCE_MS = 500;
const INK = '#111827';

function applyPenStyle(ctx: CanvasRenderingContext2D): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
}

export function SignatureField(
  props: FieldProps<IRenderableSignatureField, string | null>,
) {
  const i18n = useI18n();
  const label = stripHtml(props.field.label);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Array<Stroke>>([]);
  const isDrawingRef = useRef(false);
  const uploadTimeoutRef = useRef<number | null>(null);

  const [hasSignature, setHasSignature] = useState(false);
  const blobUpload = useUploadBlob(props.control.onChange);

  const errorMessage =
    blobUpload.manualError ??
    (blobUpload.uploadError
      ? blobUpload.uploadError instanceof Error
        ? blobUpload.uploadError.message
        : i18n.t('signature.upload_failed')
      : null);

  const savedUrl =
    typeof props.control.value === 'string' ? props.control.value : null;
  const showSavedPreview = !!savedUrl && !hasSignature;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    applyPenStyle(ctx);

    for (const stroke of strokesRef.current) {
      if (stroke.length < 2) {
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i += 1) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(CANVAS_HEIGHT * ratio));
    canvas.style.height = `${CANVAS_HEIGHT}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);

    redraw();
  }, [redraw]);

  useEffect(() => {
    resizeCanvas();
    const onResize = (): void => resizeCanvas();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (uploadTimeoutRef.current !== null) {
        window.clearTimeout(uploadTimeoutRef.current);
        uploadTimeoutRef.current = null;
      }
    };
  }, [resizeCanvas]);

  const canvasPoint = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const uploadSignature = async (): Promise<void> => {
    const canvas = canvasRef.current;
    if (!canvas || blobUpload.isUploading || !hasSignature) {
      return;
    }

    const blob = await canvasToPngBlob(canvas);
    if (!blob) {
      blobUpload.setErrorMessage(i18n.t('signature.capture_failed'));
      return;
    }

    await blobUpload.upload(blob, 'signature.png');
  };

  const cancelPendingUpload = (): void => {
    if (uploadTimeoutRef.current !== null) {
      window.clearTimeout(uploadTimeoutRef.current);
      uploadTimeoutRef.current = null;
    }
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ): void => {
    const point = canvasPoint(event);
    if (!point) {
      return;
    }

    cancelPendingUpload();

    isDrawingRef.current = true;
    strokesRef.current.push([point]);
    setHasSignature(true);
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ): void => {
    if (!isDrawingRef.current) {
      return;
    }

    const point = canvasPoint(event);
    const stroke = strokesRef.current.at(-1);
    const lastPoint = stroke?.at(-1);
    if (!point || !stroke || !lastPoint) {
      return;
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    stroke.push(point);
  };

  const handlePointerUp = (): void => {
    if (!isDrawingRef.current) {
      return;
    }

    isDrawingRef.current = false;

    if (hasSignature) {
      cancelPendingUpload();
      uploadTimeoutRef.current = window.setTimeout(
        uploadSignature,
        UPLOAD_DEBOUNCE_MS,
      );
    }
  };

  const clearSignature = (): void => {
    cancelPendingUpload();

    strokesRef.current = [];
    setHasSignature(false);
    blobUpload.setErrorMessage(null);
    props.control.onChange(null);
    redraw();
  };

  return (
    <div className="space-y-2">
      <div
        className={mediaFrame({
          height: 'md',
          layout: 'plain',
          className:
            'focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring',
        })}
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
            aria-label={label}
          />
          {showSavedPreview && (
            <div className="absolute inset-0 overflow-hidden rounded-md bg-white">
              <img
                src={savedUrl}
                alt={label}
                className="h-full w-full object-contain"
              />
            </div>
          )}
          {!hasSignature && !blobUpload.isUploading && !showSavedPreview && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-sm text-muted-foreground">
                {i18n.t('signature.draw')}
              </span>
            </div>
          )}
          <div className="absolute bottom-2 right-3" aria-live="polite">
            {blobUpload.isUploading && (
              <span className="text-sm text-muted-foreground">
                {i18n.t('signature.uploading')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <ClearButton
          label={i18n.t('signature.clear')}
          onClick={clearSignature}
          disabled={(!hasSignature && !savedUrl) || blobUpload.isUploading}
        />
      </div>

      <p className="text-sm text-destructive" aria-live="polite">
        {errorMessage ?? ''}
      </p>
    </div>
  );
}
