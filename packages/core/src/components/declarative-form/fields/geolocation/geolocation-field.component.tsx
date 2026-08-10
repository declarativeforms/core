import { AlertCircle, Loader2, MapPin, X } from 'lucide-react';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/utils';
import type { TranslationKey } from '@/i18n/messages/en';
import type { DeclarativeFieldComponentProps } from '../../supporting/field-support.types';
import { useI18n } from '@/i18n';

const GeolocationMapPreview = lazy(() => import('./geolocation-map-preview'));

type GeolocationValue = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

type ErrorCode =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NOT_SUPPORTED';

type GeolocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'refining'; value: GeolocationValue }
  | { status: 'success'; value: GeolocationValue }
  | { status: 'error'; code: ErrorCode };

function isGeolocationValue(v: unknown): v is GeolocationValue {
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

export function GeolocationField({
  controllerField,
}: DeclarativeFieldComponentProps) {
  const { t } = useI18n();

  const [state, setState] = useState<GeolocationState>(() => {
    if (isGeolocationValue(controllerField.value)) {
      return { status: 'success', value: controllerField.value };
    }
    return { status: 'idle' };
  });
  const visibleState: GeolocationState =
    state.status === 'idle' && isGeolocationValue(controllerField.value)
      ? { status: 'success', value: controllerField.value }
      : state;

  const watchIdRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bestAccuracyRef = useRef<number>(Infinity);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (settleTimerRef.current !== null) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
    };
  }, []);

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
        const locationValue: GeolocationValue = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        if (position.coords.accuracy < bestAccuracyRef.current) {
          bestAccuracyRef.current = position.coords.accuracy;

          setState((prev) => {
            if (prev.status === 'loading') {
              settleTimerRef.current = setTimeout(() => {
                if (watchIdRef.current !== null) {
                  navigator.geolocation.clearWatch(watchIdRef.current);
                  watchIdRef.current = null;
                }
                setState((s) =>
                  s.status === 'refining'
                    ? { status: 'success', value: s.value }
                    : s,
                );
              }, 3000);

              return { status: 'refining', value: locationValue };
            }
            return { status: 'refining', value: locationValue };
          });

          controllerField.onChange(locationValue);
        }
      },
      (error) => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        if (settleTimerRef.current !== null) {
          clearTimeout(settleTimerRef.current);
          settleTimerRef.current = null;
        }
        setState({
          status: 'error',
          code: codeMap[error.code] || 'POSITION_UNAVAILABLE',
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [controllerField]);

  const clearLocation = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (settleTimerRef.current !== null) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    setState({ status: 'idle' });
    controllerField.onChange(null);
  }, [controllerField]);

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
            'border border-dashed rounded-md min-h-[120px] cursor-pointer transition-colors',
            'flex flex-col items-center justify-center gap-2 p-6',
            'border-border bg-muted/40 hover:border-ring/60 hover:bg-muted/50',
            'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring',
          )}
        >
          <MapPin
            className="h-6 w-6 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="text-sm text-muted-foreground">
            {t('geolocation.use_my_location')}
          </span>
        </div>
      )}

      {visibleState.status === 'loading' && (
        <div
          className={cn(
            'border border-dashed rounded-md min-h-[120px] cursor-wait transition-colors',
            'flex flex-col items-center justify-center gap-2 p-6',
            'border-border bg-muted/40',
          )}
        >
          <Loader2
            className="h-6 w-6 text-muted-foreground animate-spin"
            aria-hidden="true"
          />
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {t('geolocation.loading')}
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
              label={t('geolocation.map_label')}
            />
          </Suspense>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={clearLocation}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
                'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted',
                'transition-colors',
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              {t('geolocation.clear')}
            </button>
          </div>

          <p className="sr-only" aria-live="polite">
            {t('geolocation.location_captured')}
          </p>
        </div>
      )}

      {visibleState.status === 'error' && (
        <div
          className={cn(
            'border border-dashed rounded-md min-h-[120px] transition-colors',
            'flex flex-col items-center justify-center gap-3 p-6',
            'border-border bg-muted/40',
          )}
        >
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {t(ERROR_MESSAGE_KEYS[visibleState.code])}
          </p>
          <button
            type="button"
            onClick={requestLocation}
            className="text-sm text-muted-foreground underline hover:text-foreground transition-colors"
          >
            {t('geolocation.try_again')}
          </button>
        </div>
      )}
    </div>
  );
}
