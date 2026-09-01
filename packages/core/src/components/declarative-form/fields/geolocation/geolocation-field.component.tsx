'use client';

import dynamic from 'next/dynamic';
import { AlertCircle, Loader2, MapPin } from 'lucide-react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import type {
  IRenderableGeolocationField,
  IRenderableGeolocationValue,
} from '@declarativeforms/engine';

import { useI18n } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import { cn } from '@/lib/utils';
import { ClearButton } from '@/components/declarative-form/supporting/clear-button.component';
import type { FieldProps } from '@/components/declarative-form/supporting/field.types';
import { mediaFrame } from '@/components/declarative-form/supporting/media-frame';

const GeolocationMapPreview = dynamic(
  () => import('./geolocation-map-preview'),
  { ssr: false },
);

type ErrorCode =
  'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED';

type GeolocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'refining'; value: IRenderableGeolocationValue }
  | { status: 'success'; value: IRenderableGeolocationValue }
  | { status: 'error'; code: ErrorCode };

const SETTLE_MS = 3000;

function isGeolocationValue(v: unknown): v is IRenderableGeolocationValue {
  return (
    typeof v === 'object' &&
    v !== null &&
    'latitude' in v &&
    'longitude' in v &&
    'accuracy' in v &&
    'timestamp' in v
  );
}

const ERROR_MESSAGE_KEYS: Record<ErrorCode, TranslationKey> = {
  PERMISSION_DENIED: 'geolocation.error_permission_denied',
  POSITION_UNAVAILABLE: 'geolocation.error_position_unavailable',
  TIMEOUT: 'geolocation.error_timeout',
  NOT_SUPPORTED: 'geolocation.error_not_supported',
};

export function GeolocationField(
  props: FieldProps<
    IRenderableGeolocationField,
    IRenderableGeolocationValue | null
  >,
) {
  const i18n = useI18n();

  const [state, setState] = useState<GeolocationState>(() => {
    if (isGeolocationValue(props.control.value)) {
      return { status: 'success', value: props.control.value };
    }
    return { status: 'idle' };
  });
  const visibleState: GeolocationState =
    state.status === 'idle' && isGeolocationValue(props.control.value)
      ? { status: 'success', value: props.control.value }
      : state;

  const watchIdRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bestAccuracyRef = useRef<number>(Infinity);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (settleTimerRef.current !== null) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  useEffect(() => stopWatching, [stopWatching]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: 'error', code: 'NOT_SUPPORTED' });
      return;
    }

    setState({ status: 'loading' });
    bestAccuracyRef.current = Infinity;

    const codeMap: Record<number, ErrorCode> = {
      [GeolocationPositionError.PERMISSION_DENIED]: 'PERMISSION_DENIED',
      [GeolocationPositionError.POSITION_UNAVAILABLE]: 'POSITION_UNAVAILABLE',
      [GeolocationPositionError.TIMEOUT]: 'TIMEOUT',
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (position.coords.accuracy >= bestAccuracyRef.current) {
          return;
        }
        bestAccuracyRef.current = position.coords.accuracy;

        const locationValue: IRenderableGeolocationValue = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        setState((prev) => {
          if (prev.status === 'loading') {
            settleTimerRef.current = setTimeout(() => {
              stopWatching();
              setState((s) =>
                s.status === 'refining'
                  ? { status: 'success', value: s.value }
                  : s,
              );
            }, SETTLE_MS);
          }
          return { status: 'refining', value: locationValue };
        });

        props.control.onChange(locationValue);
      },
      (error) => {
        stopWatching();
        setState({
          status: 'error',
          code: codeMap[error.code] || 'POSITION_UNAVAILABLE',
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [props.control, stopWatching]);

  const clearLocation = useCallback(() => {
    stopWatching();
    setState({ status: 'idle' });
    props.control.onChange(null);
  }, [props.control, stopWatching]);

  const hasCoords =
    visibleState.status === 'refining' || visibleState.status === 'success';

  return (
    <div className="space-y-3">
      {visibleState.status === 'idle' && (
        <div
          role="button"
          tabIndex={0}
          onClick={requestLocation}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              requestLocation();
            }
          }}
          className={cn(
            mediaFrame({ height: 'sm', interactive: true }),
            'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring',
          )}
        >
          <MapPin
            className="h-6 w-6 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="text-sm text-muted-foreground">
            {i18n.t('geolocation.use_my_location')}
          </span>
        </div>
      )}

      {visibleState.status === 'loading' && (
        <div className={cn(mediaFrame({ height: 'sm' }), 'cursor-wait')}>
          <Loader2
            className="h-6 w-6 text-muted-foreground animate-spin"
            aria-hidden="true"
          />
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {i18n.t('geolocation.loading')}
          </span>
        </div>
      )}

      {hasCoords && (
        <div className="space-y-3">
          <Suspense
            fallback={
              <div className="h-[200px] w-full animate-pulse rounded-md border bg-muted" />
            }
          >
            <GeolocationMapPreview
              latitude={visibleState.value.latitude}
              longitude={visibleState.value.longitude}
              accuracy={visibleState.value.accuracy}
              label={i18n.t('geolocation.map_label')}
            />
          </Suspense>

          <div className="flex items-center justify-between">
            <ClearButton
              label={i18n.t('geolocation.clear')}
              onClick={clearLocation}
            />
          </div>

          <p className="sr-only" aria-live="polite">
            {i18n.t('geolocation.location_captured')}
          </p>
        </div>
      )}

      {visibleState.status === 'error' && (
        <div className={cn(mediaFrame({ height: 'sm' }), 'gap-3')}>
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {i18n.t(ERROR_MESSAGE_KEYS[visibleState.code])}
          </p>
          <button
            type="button"
            onClick={requestLocation}
            className="text-sm text-muted-foreground underline hover:text-foreground transition-colors"
          >
            {i18n.t('geolocation.try_again')}
          </button>
        </div>
      )}
    </div>
  );
}
