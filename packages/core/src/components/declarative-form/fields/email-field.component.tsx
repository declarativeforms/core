import { Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';

import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { IRenderableEmailField } from '@declarativeforms/engine';
import type { DeclarativeFieldComponentProps } from '../supporting/field-support';
import { useI18n } from '@/i18n';
import { sendEmailOtp, verifyEmailOtp } from './email/api';
import { isEmailValid, sanitizeOtpCode, toFieldString } from './email/utils';
import { getSecondaryValidationTokenFieldName } from './secondary-token-field';

const SET_SILENT = {
  shouldDirty: false,
  shouldTouch: false,
  shouldValidate: false,
} as const;

type OtpState = {
  requestId: string;
  code: string;
  status: string | null;
  sending: boolean;
  verifying: boolean;
  resendAt: number;
};

const INITIAL_OTP: OtpState = {
  requestId: '',
  code: '',
  status: null,
  sending: false,
  verifying: false,
  resendAt: 0,
};

export function EmailField({
  field,
  controllerField,
  form,
}: DeclarativeFieldComponentProps<IRenderableEmailField>) {
  const { t } = useI18n();
  const otpEnabled = field.otpEnabled;
  const tokenFieldName = useMemo(
    () => field.tokenFieldName ?? getSecondaryValidationTokenFieldName(field.id),
    [field.tokenFieldName, field.id],
  );
  const otpMessages = useMemo(
    () => ({
      enterCode: t('email.otp.enter_code'),
      invalidCode: t('email.otp.invalid_code'),
      invalidEmailBeforeSend: t('email.otp.invalid_email_before_send'),
      requestCodeFirst: t('email.otp.request_code_first'),
      requestFailed: t('email.otp.request_failed'),
      sendFailed: t('email.otp.send_failed'),
      startFailed: t('email.otp.start_failed'),
      tokenMissing: t('email.otp.token_missing'),
    }),
    [t],
  );

  const [otp, setOtp] = useState<OtpState>(INITIAL_OTP);
  const [clockMs, setClockMs] = useState(() => Date.now());

  useEffect(() => {
    if (!otpEnabled) {
      return;
    }
    form.register(tokenFieldName);
    if (form.getValues(tokenFieldName) === undefined) {
      form.setValue(tokenFieldName, '', SET_SILENT);
    }
  }, [form, otpEnabled, tokenFieldName]);

  useEffect(() => {
    if (otp.resendAt <= Date.now()) {
      return;
    }
    const timer = window.setInterval(() => setClockMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [otp.resendAt]);

  const watchedToken = useWatch({ control: form.control, name: tokenFieldName });
  const verificationToken =
    typeof watchedToken === 'string' ? watchedToken : '';
  const isVerified = verificationToken !== '';
  const emailValue = useMemo(
    () => toFieldString(controllerField.value),
    [controllerField.value],
  );
  const secondsUntilResend = Math.max(
    0,
    Math.ceil((otp.resendAt - clockMs) / 1000),
  );

  const onEmailChange = (nextValue: string) => {
    controllerField.onChange(nextValue);
    if (!otpEnabled) {
      return;
    }
    if (isVerified || otp.requestId || verificationToken) {
      form.setValue(tokenFieldName, '', SET_SILENT);
      setOtp(INITIAL_OTP);
      void form.trigger(field.id);
    }
  };

  const sendOtp = async () => {
    if (!isEmailValid(emailValue)) {
      setOtp((o) => ({ ...o, status: otpMessages.invalidEmailBeforeSend }));
      return;
    }
    setOtp((o) => ({ ...o, sending: true, status: null }));
    try {
      const { requestId, resendAfterSeconds } = await sendEmailOtp({
        email: emailValue,
        fieldId: field.id,
        messages: {
          requestFailed: otpMessages.requestFailed,
          startFailed: otpMessages.startFailed,
          tokenMissing: otpMessages.tokenMissing,
        },
      });
      form.setValue(tokenFieldName, '', { ...SET_SILENT, shouldDirty: true });
      setClockMs(Date.now());
      setOtp((o) => ({
        ...o,
        requestId,
        code: '',
        resendAt: Date.now() + Math.max(1, resendAfterSeconds) * 1000,
        sending: false,
      }));
      void form.trigger(field.id);
    } catch (error) {
      setOtp((o) => ({
        ...o,
        sending: false,
        status: error instanceof Error ? error.message : otpMessages.sendFailed,
      }));
    }
  };

  const verifyOtp = async () => {
    if (!otp.requestId) {
      setOtp((o) => ({ ...o, status: otpMessages.requestCodeFirst }));
      return;
    }
    if (!otp.code.trim()) {
      setOtp((o) => ({ ...o, status: otpMessages.enterCode }));
      return;
    }
    setOtp((o) => ({ ...o, verifying: true, status: null }));
    try {
      const { verificationToken: nextToken } = await verifyEmailOtp({
        email: emailValue,
        otp: otp.code.trim(),
        requestId: otp.requestId,
        messages: {
          requestFailed: otpMessages.requestFailed,
          startFailed: otpMessages.startFailed,
          tokenMissing: otpMessages.tokenMissing,
        },
      });
      form.setValue(tokenFieldName, nextToken, {
        ...SET_SILENT,
        shouldDirty: true,
        shouldValidate: true,
      });
      setOtp((o) => ({ ...o, code: '', verifying: false }));
      await form.trigger(field.id);
    } catch {
      setOtp((o) => ({ ...o, verifying: false, status: otpMessages.invalidCode }));
    }
  };

  if (!otpEnabled) {
    return (
      <Input
        {...controllerField}
        className="text-sm/4"
        placeholder={field.placeholder || t('email.placeholder_default')}
        type="email"
        required={field.required}
        aria-required={field.required}
        minLength={field.min}
        maxLength={field.max}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          {...controllerField}
          className={cn('text-sm/4', {
            'bg-muted/60 border-muted-foreground/30 text-muted-foreground pr-10 cursor-not-allowed':
              isVerified,
            'pr-20': !isVerified,
          })}
          placeholder={field.placeholder || t('email.placeholder_otp')}
          type="email"
          value={emailValue}
          onChange={(event) => onEmailChange(event.target.value)}
          required={field.required}
          aria-required={field.required}
          aria-readonly={isVerified}
          readOnly={isVerified}
          minLength={field.min}
          maxLength={field.max}
        />

        {isVerified ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center">
            <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
          </span>
        ) : (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:opacity-50"
            disabled={
              otp.sending ||
              !isEmailValid(emailValue) ||
              (otp.requestId !== '' && secondsUntilResend > 0)
            }
            onClick={() => {
              void sendOtp();
            }}
          >
            {otp.requestId
              ? secondsUntilResend > 0
                ? t('email.otp.resend_in_seconds', { seconds: secondsUntilResend })
                : t('email.otp.resend')
              : t('email.otp.send_code')}
          </button>
        )}
      </div>

      {!isVerified && otp.requestId ? (
        <div className="relative">
          <Input
            value={otp.code}
            onChange={(event) =>
              setOtp((o) => ({ ...o, code: sanitizeOtpCode(event.target.value) }))
            }
            placeholder={t('email.otp.verification_code_placeholder')}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="pr-10 text-sm/4"
            aria-label={t('email.otp.verification_code_aria_label')}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:opacity-50"
            disabled={otp.verifying || otp.code.length === 0}
            aria-label={t('email.otp.verify')}
            onClick={() => {
              void verifyOtp();
            }}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <p className="text-sm text-destructive" aria-live="polite">
        {otp.status ?? ''}
      </p>
    </div>
  );
}
