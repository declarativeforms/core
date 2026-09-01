'use client';
import { Camera, Loader2, RefreshCw, VideoOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { IRenderableCameraField } from '@declarativeforms/engine';
import { Button } from '@/components/ui';
import { useI18n } from '@/i18n';
import { stripHtml } from '@/lib/strip-html';
import { cn } from '@/lib/utils';
import {
  mediaFrame,
  type FieldProps,
} from '@/components/declarative-form/supporting';
import { canvasToPngBlob, useUploadBlob } from './use-upload-blob';

type CameraStatus = 'idle' | 'previewing' | 'uploading' | 'captured' | 'error';
type CameraState = {
  status: CameraStatus;
  url: string | null;
  error: string | null;
};

export function CameraField(
  props: FieldProps<IRenderableCameraField, string | null>,
) {
  const i18n = useI18n();
  const label = stripHtml(props.field.label);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camera, setCamera] = useState<CameraState>(() => ({
    status: props.control.value ? 'captured' : 'idle',
    url: typeof props.control.value === 'string' ? props.control.value : null,
    error: null,
  }));
  const blobUpload = useUploadBlob(props.control.onChange);

  const errorMessage =
    camera.status === 'error'
      ? (camera.error ??
        (blobUpload.uploadError instanceof Error
          ? blobUpload.uploadError.message
          : i18n.t('camera.upload_failed')))
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

  const startCamera = async (): Promise<void> => {
    setCamera((c) => ({ ...c, status: 'previewing', error: null }));

    try {
      const facingMode =
        props.field.facingMode === 'front' ? 'user' : 'environment';
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: facingMode } },
        });
      } catch (err) {
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

      let message = i18n.t('camera.access_failed');
      if (err instanceof DOMException) {
        if (
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError'
        ) {
          message = i18n.t('camera.permission_denied');
        } else if (
          err.name === 'NotFoundError' ||
          err.name === 'DevicesNotFoundError'
        ) {
          message = i18n.t('camera.not_found');
        }
      }
      setCamera((c) => ({ ...c, status: 'error', error: message }));
    }
  };

  const capturePhoto = async (): Promise<void> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.drawImage(video, 0, 0);

    stopStream();
    setCamera((c) => ({ ...c, status: 'uploading' }));

    const blob = await canvasToPngBlob(canvas);
    if (!blob) {
      setCamera((c) => ({
        ...c,
        status: 'error',
        error: i18n.t('camera.upload_failed'),
      }));

      return;
    }

    const url = await blobUpload.upload(blob, 'camera-capture.png');
    setCamera((c) =>
      url ? { ...c, status: 'captured', url } : { ...c, status: 'error' },
    );
  };

  const retake = (): void => {
    props.control.onChange(null);
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
          aria-label={i18n.t('camera.open_camera')}
        >
          <Camera
            className="w-8 h-8 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="text-sm text-foreground">
            {i18n.t('camera.open_camera')}
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
            {i18n.t('camera.capture')}
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
            {i18n.t('camera.uploading')}
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
            {i18n.t('camera.retake')}
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
            {i18n.t('camera.try_again')}
          </Button>
        </div>
      )}
    </div>
  );
}
