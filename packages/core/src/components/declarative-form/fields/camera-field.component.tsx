'use client';

import { Camera, Loader2, RefreshCw, VideoOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { IRenderableCameraField } from '@declarativeforms/engine';

import { Button } from '@/components/ui';
import { useI18n } from '@/i18n';
import { stripHtml } from '@/lib/strip-html';
import { cn } from '@/lib/utils';
import type { FieldProps } from '../supporting/field.types';
import { mediaFrame } from '../supporting/media-frame';
import { canvasToPngBlob, useUploadBlob } from './use-upload-blob';

type CameraStatus = 'idle' | 'previewing' | 'uploading' | 'captured' | 'error';
type CameraState = {
  status: CameraStatus;
  url: string | null;
  error: string | null;
};

export function CameraField({
  field,
  control,
}: FieldProps<IRenderableCameraField, string | null>) {
  const { t } = useI18n();
  const label = stripHtml(field.label);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camera, setCamera] = useState<CameraState>(() => ({
    status: control.value ? 'captured' : 'idle',
    url: typeof control.value === 'string' ? control.value : null,
    error: null,
  }));
  const { upload, uploadError } = useUploadBlob(control.onChange);

  const errorMessage =
    camera.status === 'error'
      ? (camera.error ??
        (uploadError instanceof Error
          ? uploadError.message
          : t('camera.upload_failed')))
      : null;

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const startCamera = async () => {
    setCamera((c) => ({ ...c, status: 'previewing', error: null }));

    try {
      const facingMode = field.facingMode === 'front' ? 'user' : 'environment';
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: facingMode } },
        });
      } catch (err) {
        // Not every browser exposes `OverconstrainedError` as a global, so the
        // check has to survive it being absent.
        const isOverconstrained =
          typeof OverconstrainedError !== 'undefined' &&
          err instanceof OverconstrainedError;

        if (!isOverconstrained) {
          throw err;
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      stopStream();

      let message = t('camera.access_failed');
      if (err instanceof DOMException) {
        if (
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError'
        ) {
          message = t('camera.permission_denied');
        } else if (
          err.name === 'NotFoundError' ||
          err.name === 'DevicesNotFoundError'
        ) {
          message = t('camera.not_found');
        }
      }
      setCamera((c) => ({ ...c, status: 'error', error: message }));
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    stopStream();
    setCamera((c) => ({ ...c, status: 'uploading' }));

    const blob = await canvasToPngBlob(canvas);
    if (!blob) {
      setCamera((c) => ({
        ...c,
        status: 'error',
        error: t('camera.upload_failed'),
      }));
      return;
    }

    const url = await upload(blob, 'camera-capture.png');
    setCamera((c) =>
      url ? { ...c, status: 'captured', url } : { ...c, status: 'error' },
    );
  };

  const retake = () => {
    control.onChange(null);
    setCamera((c) => ({ ...c, url: null, error: null }));
    startCamera();
  };

  return (
    <div className="space-y-2">
      <canvas ref={canvasRef} className="hidden" />

      {camera.status === 'idle' && (
        <button
          type="button"
          onClick={startCamera}
          className={cn(
            'w-full',
            mediaFrame({ height: 'md', interactive: true }),
            'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring',
          )}
          aria-label={t('camera.open_camera')}
        >
          <Camera className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm text-foreground">
            {t('camera.open_camera')}
          </span>
        </button>
      )}

      {camera.status === 'previewing' && (
        <div className="space-y-2">
          <div className={mediaFrame({ layout: 'clip' })}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-md"
              aria-label={label}
            />
          </div>
          <Button type="button" onClick={capturePhoto} className="w-full">
            <Camera className="w-4 h-4 mr-2" aria-hidden="true" />
            {t('camera.capture')}
          </Button>
        </div>
      )}

      {camera.status === 'uploading' && (
        <div className={mediaFrame({ height: 'md' })}>
          <Loader2
            className="w-8 h-8 text-muted-foreground animate-spin"
            aria-hidden="true"
          />
          <span className="text-sm text-muted-foreground">
            {t('camera.uploading')}
          </span>
        </div>
      )}

      {camera.status === 'captured' && camera.url && (
        <div className="space-y-2">
          <div className={mediaFrame({ layout: 'clip' })}>
            <img src={camera.url} alt={label} className="w-full rounded-md" />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={retake}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            {t('camera.retake')}
          </Button>
        </div>
      )}

      {camera.status === 'error' && (
        <div className="space-y-2">
          <div className={mediaFrame({ height: 'md', tone: 'error' })}>
            <VideoOff className="w-8 h-8 text-destructive" aria-hidden="true" />
            <p
              className="text-sm text-destructive text-center"
              aria-live="polite"
            >
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
            {t('camera.try_again')}
          </Button>
        </div>
      )}
    </div>
  );
}
