import { Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';

import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { DeclarativeFieldComponentProps } from '../supporting/field-support';
import { buildFieldValidation } from '../supporting/validation';
import { useFormI18n } from '../supporting/use-form-i18n';
import { sendEmailOtp, verifyEmailOtp } from './email/api';
import { isEmailValid, sanitizeOtpCode, toFieldString } from './email/utils';
import { getSecondaryValidationTokenFieldName } from './secondary-token-field';

export function EmailField({
  field,
  controllerField,
  form,
}: DeclarativeFieldComponentProps) {
  const { t } = useFormI18n();
  const otpEnabled = field.type === 'email' && field.otp === true;
  const tokenFieldName = useMemo(
    () => getSecondaryValidationTokenFieldName(field.id),
    [field.id],
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
  const { minLength, maxLength } = buildFieldValidation(field);

  useEffect(() => {
    if (!otpEnabled) {
      return;
    }

    form.register(tokenFieldName);

    const options = {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    } as const;

    if (form.getValues(tokenFieldName) === undefined) {
      form.setValue(tokenFieldName, '', options);
    }
  }, [form, otpEnabled, tokenFieldName]);

  const watchedToken = useWatch({
    control: form.control,
    name: tokenFieldName,
  });

  const verificationToken =
    typeof watchedToken === 'string' ? watchedToken : '';
  const isVerified = verificationToken !== '';
  const emailValue = useMemo(
    () => toFieldString(controllerField.value),
    [controllerField.value],
  );

  const [requestId, setRequestId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [clockMs, setClockMs] = useState(() => Date.now());

  useEffect(() => {
    if (resendAvailableAt <= Date.now()) {
      return;
    }

    const timer = window.setInterval(() => {
      setClockMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendAvailableAt]);

  const secondsUntilResend = Math.max(
    0,
    Math.ceil((resendAvailableAt - clockMs) / 1000),
  );

  const clearOtpState = () => {
    if (!otpEnabled) {
      return;
    }

    const options = {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    } as const;

    form.setValue(tokenFieldName, '', options);
    setRequestId('');
    setOtpCode('');
    setResendAvailableAt(0);
    setStatusMessage(null);
  };

  const onEmailChange = (nextValue: string) => {
    controllerField.onChange(nextValue);

    if (!otpEnabled) {
      return;
    }

    if (isVerified || requestId || verificationToken) {
      clearOtpState();
      void form.trigger(field.id);
    }
  };

  const sendOtp = async () => {
    if (!isEmailValid(emailValue)) {
      setStatusMessage(otpMessages.invalidEmailBeforeSend);
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const { requestId: nextRequestId, resendAfterSeconds } = await sendEmailOtp({
        email: emailValue,
        fieldId: field.id,
        messages: {
          requestFailed: otpMessages.requestFailed,
          startFailed: otpMessages.startFailed,
          tokenMissing: otpMessages.tokenMissing,
        },
      });

      const options = {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: false,
      } as const;

      form.setValue(tokenFieldName, '', options);
      setRequestId(nextRequestId);
      setOtpCode('');
      setResendAvailableAt(Date.now() + Math.max(1, resendAfterSeconds) * 1000);
      setClockMs(Date.now());
      void form.trigger(field.id);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : otpMessages.sendFailed,
      );
    } finally {
      setIsSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!requestId) {
      setStatusMessage(otpMessages.requestCodeFirst);
      return;
    }

    if (!otpCode.trim()) {
      setStatusMessage(otpMessages.enterCode);
      return;
    }

    setIsVerifying(true);
    setStatusMessage(null);

    try {
      const { verificationToken: nextVerificationToken } = await verifyEmailOtp({
        email: emailValue,
        otp: otpCode.trim(),
        requestId,
        messages: {
          requestFailed: otpMessages.requestFailed,
          startFailed: otpMessages.startFailed,
          tokenMissing: otpMessages.tokenMissing,
        },
      });

      const options = {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: true,
      } as const;

      form.setValue(tokenFieldName, nextVerificationToken, options);
      setOtpCode('');
      await form.trigger(field.id);
    } catch {
      setStatusMessage(otpMessages.invalidCode);
    } finally {
      setIsVerifying(false);
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
        minLength={minLength}
        maxLength={maxLength}
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
          minLength={minLength}
          maxLength={maxLength}
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
              isSending ||
              !isEmailValid(emailValue) ||
              (requestId !== '' && secondsUntilResend > 0)
            }
            onClick={() => {
              void sendOtp();
            }}
          >
            {requestId
              ? secondsUntilResend > 0
                ? t('email.otp.resend_in_seconds', {
                    seconds: secondsUntilResend,
                  })
                : t('email.otp.resend')
              : t('email.otp.send_code')}
          </button>
        )}
      </div>

      {!isVerified && requestId ? (
        <div className="relative">
          <Input
            value={otpCode}
            onChange={(event) => setOtpCode(sanitizeOtpCode(event.target.value))}
            placeholder={t('email.otp.verification_code_placeholder')}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="pr-10 text-sm/4"
            aria-label={t('email.otp.verification_code_aria_label')}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:opacity-50"
            disabled={isVerifying || otpCode.length === 0}
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
        {statusMessage ?? ''}
      </p>
    </div>
  );
}
