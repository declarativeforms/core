'use client';
import { useEffect, useRef, useState } from 'react';
import { useFormState, useWatch } from 'react-hook-form';
import {
  getTokenFieldId,
  type IRenderableTurnstileField,
} from '@declarativeforms/engine';
import { Button, FieldError } from '@/components/ui';
import { type FieldProps } from '@/components/declarative-form/supporting';
import { useI18n } from '@/i18n';
import { buildApiUrl } from '@/lib/api';
import { getRuntimeConfig } from '@/lib/runtime-config';
import { loadTurnstile } from './turnstile';

type VerificationStatus =
  'loading' | 'verifying' | 'failed' | 'unavailable' | 'ready';

export function TurnstileField(
  props: FieldProps<IRenderableTurnstileField, string>,
): React.JSX.Element {
  const i18n = useI18n();
  const container = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const tokenFieldId = getTokenFieldId(props.field.id);
  const proofToken = useWatch({
    control: props.form.control,
    name: tokenFieldId,
  });
  const tokenFormState = useFormState({
    control: props.form.control,
    name: tokenFieldId,
  });
  const isVerified =
    props.control.value === 'verified' &&
    typeof proofToken === 'string' &&
    proofToken.length > 0;
  const onChange = props.control.onChange;
  const setValue = props.form.setValue;
  const clearErrors = props.form.clearErrors;

  useEffect(() => {
    if (isVerified || !container.current) {
      return;
    }

    onChange('');
    setValue(tokenFieldId, '');
    const siteKey = getRuntimeConfig().turnstileSiteKey;

    if (!siteKey || !props.formId) {
      setStatus('unavailable');

      return;
    }

    let disposed = false;
    let exchanging = false;
    let removeWidget: (() => void) | undefined;
    const controller = new AbortController();
    setStatus('loading');

    function markFailed(): void {
      if (disposed || exchanging) {
        return;
      }

      setStatus('failed');
    }

    async function verify(responseToken: string): Promise<void> {
      if (disposed || exchanging) {
        return;
      }

      exchanging = true;
      setStatus('verifying');

      try {
        const response = await fetch(
          buildApiUrl(
            `forms/${encodeURIComponent(props.formId)}/turnstile/verify`,
          ),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              field_id: props.field.id,
              response: responseToken,
            }),
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(15000),
            ]),
          },
        );

        if (!response.ok) {
          throw new Error('Verification failed');
        }

        const payload = (await response.json()) as { token?: unknown };

        if (typeof payload?.token !== 'string' || !payload.token) {
          throw new Error('Verification failed');
        }

        if (disposed) {
          return;
        }

        setValue(tokenFieldId, payload.token, {
          shouldDirty: true,
          shouldValidate: true,
        });
        onChange('verified');
        clearErrors([props.field.id, tokenFieldId]);
      } catch {
        if (!disposed) {
          setStatus('failed');
        }
      }
    }

    loadTurnstile()
      .then((turnstile): void => {
        if (disposed || !container.current) {
          return;
        }

        setStatus('ready');
        const widgetId = turnstile.render(container.current, {
          sitekey: siteKey,
          language: i18n.locale,
          'response-field': false,
          retry: 'never',
          callback: (response): void => {
            void verify(response);
          },
          'error-callback': markFailed,
          'expired-callback': markFailed,
          'timeout-callback': markFailed,
        });
        removeWidget = (): void => turnstile.remove(widgetId);
      })
      .catch((): void => {
        if (!disposed) {
          setStatus('failed');
        }
      });

    return (): void => {
      disposed = true;
      controller.abort();
      removeWidget?.();
    };
  }, [
    attempt,
    isVerified,
    props.formId,
    props.field.id,
    tokenFieldId,
    i18n.locale,
    onChange,
    setValue,
    clearErrors,
  ]);

  function retry(): void {
    props.control.onChange('');
    props.form.setValue(tokenFieldId, '', { shouldDirty: true });
    props.form.clearErrors([props.field.id, tokenFieldId]);
    setAttempt((current): number => current + 1);
  }

  return (
    <div
      className="space-y-3"
      id={props.field.id}
      ref={props.control.ref}
      tabIndex={-1}
      onBlur={props.control.onBlur}
    >
      <div ref={container} hidden={isVerified} />
      <p role="status" className="text-sm text-muted-foreground">
        {isVerified
          ? i18n.t('turnstile.success')
          : status === 'ready'
            ? null
            : i18n.t(`turnstile.${status}`)}
      </p>
      {isVerified || status === 'failed' || status === 'unavailable' ? (
        <Button type="button" variant="outline" onClick={retry}>
          {i18n.t('turnstile.retry')}
        </Button>
      ) : null}
      <FieldError errors={[tokenFormState.errors[tokenFieldId]]} />
    </div>
  );
}
