'use client';
import {
  getTokenFieldId,
  type IRenderableEmailField,
} from '@declarativeforms/engine';
import { useEffect, useState } from 'react';
import { useFormState, useWatch } from 'react-hook-form';
import { Button, FieldError, Input } from '@/components/ui';
import { useI18n } from '@/i18n';
import { getBackendUrl } from '@/lib/api';
import {
  bindTextInput,
  type FieldProps,
} from '@/components/declarative-form/supporting';

type ChallengeResponse = {
  challenge: string;
  resend_after_seconds: number;
};

type VerificationResponse = {
  token: string;
};

async function getResponseMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const payload = (await response.json().catch(() => null)) as {
    message?: unknown;
  } | null;

  return typeof payload?.message === 'string' ? payload.message : fallback;
}

export function EmailField(props: FieldProps<IRenderableEmailField, string>) {
  const i18n = useI18n();
  const [challenge, setChallenge] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const tokenFieldId = getTokenFieldId(props.field.id);
  const proofToken = useWatch({
    control: props.form.control,
    name: tokenFieldId,
  });
  const tokenFormState = useFormState({
    control: props.form.control,
    name: tokenFieldId,
  });
  const isVerified = typeof proofToken === 'string' && proofToken.length > 0;
  const input = bindTextInput(props.control);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timeout = window.setTimeout(
      () => setResendSeconds((current) => Math.max(0, current - 1)),
      1000,
    );

    return () => window.clearTimeout(timeout);
  }, [resendSeconds]);

  function resetChallenge(): void {
    setChallenge('');
    setCode('');
    setMessage('');
    setResendSeconds(0);
  }

  async function requestCode(): Promise<void> {
    setIsRequesting(true);
    setMessage('');

    try {
      const response = await fetch(
        getBackendUrl(
          `forms/${encodeURIComponent(props.formId)}/email-challenges`,
        ),
        {
          body: JSON.stringify({
            email_address: props.control.value,
            field_id: props.field.id,
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new Error(
          await getResponseMessage(
            response,
            i18n.t('email.verification_request_failed'),
          ),
        );
      }

      const payload = (await response.json()) as ChallengeResponse;
      setChallenge(payload.challenge);
      setResendSeconds(payload.resend_after_seconds);
      setCode('');
      setMessage(i18n.t('email.verification_code_sent'));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : i18n.t('email.verification_request_failed'),
      );
    } finally {
      setIsRequesting(false);
    }
  }

  async function verifyCode(): Promise<void> {
    setIsVerifying(true);
    setMessage('');

    try {
      const response = await fetch(
        getBackendUrl(
          `forms/${encodeURIComponent(props.formId)}/email-challenges/verify`,
        ),
        {
          body: JSON.stringify({
            challenge,
            code,
            email_address: props.control.value,
            field_id: props.field.id,
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new Error(
          await getResponseMessage(
            response,
            i18n.t('email.verification_invalid_code'),
          ),
        );
      }

      const payload = (await response.json()) as VerificationResponse;
      props.form.setValue(tokenFieldId, payload.token, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setChallenge('');
      setCode('');
      setMessage(i18n.t('email.verification_success'));
      await props.form.trigger(tokenFieldId);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : i18n.t('email.verification_invalid_code'),
      );
    } finally {
      setIsVerifying(false);
    }
  }

  function changeEmail(): void {
    props.form.setValue(tokenFieldId, '', {
      shouldDirty: true,
      shouldValidate: false,
    });
    props.form.clearErrors(tokenFieldId);
    resetChallenge();
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          {...input}
          onChange={(event) => {
            input.onChange(event);
            resetChallenge();
          }}
          className="text-sm/4"
          placeholder={
            props.field.placeholder || i18n.t('email.placeholder_default')
          }
          type="email"
          required={props.field.required}
          aria-required={props.field.required}
          minLength={props.field.min}
          maxLength={props.field.max}
          disabled={isVerified || isRequesting || isVerifying}
        />
        {props.field.otp ? (
          isVerified ? (
            <Button type="button" variant="outline" onClick={changeEmail}>
              {i18n.t('email.verification_change')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={
                isRequesting ||
                isVerifying ||
                resendSeconds > 0 ||
                !props.control.value?.trim() ||
                !props.formId
              }
              onClick={requestCode}
            >
              {isRequesting
                ? i18n.t('email.verification_sending')
                : resendSeconds > 0
                  ? i18n.t('email.verification_resend_in', {
                      seconds: resendSeconds,
                    })
                  : challenge
                    ? i18n.t('email.verification_resend')
                    : i18n.t('email.verification_send')}
            </Button>
          )
        ) : null}
      </div>

      {props.field.otp && challenge && !isVerified ? (
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="text-sm/4"
            placeholder={i18n.t('email.verification_code_placeholder')}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
          />
          <Button
            type="button"
            disabled={isVerifying || code.length !== 6}
            onClick={verifyCode}
          >
            {isVerifying
              ? i18n.t('email.verification_verifying')
              : i18n.t('email.verification_verify')}
          </Button>
        </div>
      ) : null}

      {props.field.otp && isVerified ? (
        <p className="text-sm text-green-700">
          {i18n.t('email.verification_success')}
        </p>
      ) : message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}

      {props.field.otp ? (
        <FieldError errors={[tokenFormState.errors[tokenFieldId]]} />
      ) : null}
    </div>
  );
}
