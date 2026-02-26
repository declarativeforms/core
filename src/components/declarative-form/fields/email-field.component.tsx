import { useEffect, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { Check } from "lucide-react";

import type { DeclarativeFieldComponentProps } from "../field-contract";
import { getOtpFieldNames, isOtpVerifiedValue } from "../otp-field-names";
import { FormControl, Input } from "@/components/ui";
import { useFormI18n } from "../use-form-i18n";
import { cn } from "@/lib/utils";
import { sendEmailOtp, verifyEmailOtp } from "./email/api";
import { isEmailValid, sanitizeOtpCode, toFieldString } from "./email/utils";

export function EmailField({
  field,
  controllerField,
  form,
  meta,
}: DeclarativeFieldComponentProps) {
  const { t } = useFormI18n();
  const otpEnabled = field.type === "email" && field.otp === true;
  const otpFieldNames = useMemo(() => getOtpFieldNames(field.id), [field.id]);
  const otpMessages = useMemo(
    () => ({
      enterCode: t("email.otp.enter_code"),
      invalidCode: t("email.otp.invalid_code"),
      invalidEmailBeforeSend: t("email.otp.invalid_email_before_send"),
      requestCodeFirst: t("email.otp.request_code_first"),
      requestFailed: t("email.otp.request_failed"),
      sendFailed: t("email.otp.send_failed"),
      startFailed: t("email.otp.start_failed"),
      tokenMissing: t("email.otp.token_missing"),
    }),
    [t]
  );

  useEffect(() => {
    if (!otpEnabled) {
      return;
    }

    form.register(otpFieldNames.verified);
    form.register(otpFieldNames.token);
    form.register(otpFieldNames.requestId);

    const options = {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    } as const;

    if (form.getValues(otpFieldNames.verified) === undefined) {
      form.setValue(otpFieldNames.verified, false, options);
    }

    if (form.getValues(otpFieldNames.token) === undefined) {
      form.setValue(otpFieldNames.token, "", options);
    }

    if (form.getValues(otpFieldNames.requestId) === undefined) {
      form.setValue(otpFieldNames.requestId, "", options);
    }
  }, [form, otpEnabled, otpFieldNames]);

  const watchedVerified = useWatch({
    control: form.control,
    name: otpFieldNames.verified,
  });
  const watchedToken = useWatch({
    control: form.control,
    name: otpFieldNames.token,
  });
  const watchedRequestId = useWatch({
    control: form.control,
    name: otpFieldNames.requestId,
  });

  const isVerified = isOtpVerifiedValue(watchedVerified);
  const otpRequestId =
    typeof watchedRequestId === "string" ? watchedRequestId : "";
  const otpToken = typeof watchedToken === "string" ? watchedToken : "";

  const emailValue = useMemo(
    () => toFieldString(controllerField.value),
    [controllerField.value]
  );

  const [otpCode, setOtpCode] = useState("");
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
    Math.ceil((resendAvailableAt - clockMs) / 1000)
  );

  const setOtpFieldValues = (
    values: { requestId: string; token: string; verified: boolean },
    options: {
      shouldDirty: boolean;
      shouldTouch: boolean;
      shouldValidate: boolean;
    }
  ) => {
    form.setValue(otpFieldNames.verified, values.verified, options);
    form.setValue(otpFieldNames.token, values.token, options);
    form.setValue(otpFieldNames.requestId, values.requestId, options);
  };

  const clearOtpState = () => {
    if (!otpEnabled) {
      return;
    }

    const options = {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    } as const;

    setOtpFieldValues({ requestId: "", token: "", verified: false }, options);

    setOtpCode("");
    setResendAvailableAt(0);
    setStatusMessage(null);
  };

  const onEmailChange = (nextValue: string) => {
    controllerField.onChange(nextValue);

    if (!otpEnabled) {
      return;
    }

    if (isVerified || otpRequestId || otpToken) {
      clearOtpState();
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
      const { requestId, resendAfterSeconds } = await sendEmailOtp({
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

      setOtpFieldValues({ requestId, token: "", verified: false }, options);

      setOtpCode("");
      setResendAvailableAt(Date.now() + Math.max(1, resendAfterSeconds) * 1000);
      setClockMs(Date.now());
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : otpMessages.sendFailed
      );
    } finally {
      setIsSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpRequestId) {
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
      const { verificationToken } = await verifyEmailOtp({
        email: emailValue,
        fieldId: field.id,
        otp: otpCode.trim(),
        requestId: otpRequestId,
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

      setOtpFieldValues(
        { requestId: otpRequestId, token: verificationToken, verified: true },
        options
      );
      setOtpCode("");
      form.trigger(field.id);
    } catch {
      setStatusMessage(otpMessages.invalidCode);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!otpEnabled) {
    return (
      <FormControl>
        <Input
          {...controllerField}
          className="text-sm/4"
          placeholder={field.placeholder || t("email.placeholder_default")}
          type="email"
          required={meta.isRequired}
          aria-required={meta.isRequired}
          minLength={
            typeof meta.minValidator?.value === "number"
              ? meta.minValidator.value
              : undefined
          }
          maxLength={
            typeof meta.maxValidator?.value === "number"
              ? meta.maxValidator.value
              : undefined
          }
        />
      </FormControl>
    );
  }

  return (
    <FormControl>
      <div className="space-y-2">
        <div className="relative">
          <Input
            {...controllerField}
            className={cn("text-sm/4", {
              "bg-muted/60 border-muted-foreground/30 text-muted-foreground pr-10 cursor-not-allowed":
                isVerified,
              "pr-20": !isVerified,
            })}
            placeholder={field.placeholder || t("email.placeholder_otp")}
            type="email"
            value={emailValue}
            onChange={(event) => onEmailChange(event.target.value)}
            required={meta.isRequired}
            aria-required={meta.isRequired}
            aria-readonly={isVerified}
            readOnly={isVerified}
            minLength={
              typeof meta.minValidator?.value === "number"
                ? meta.minValidator.value
                : undefined
            }
            maxLength={
              typeof meta.maxValidator?.value === "number"
                ? meta.maxValidator.value
                : undefined
            }
          />

          {isVerified && (
            <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center">
              <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
            </span>
          )}

          {!isVerified && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:opacity-50"
              disabled={
                isSending ||
                !isEmailValid(emailValue) ||
                (otpRequestId !== "" && secondsUntilResend > 0)
              }
              onClick={() => {
                void sendOtp();
              }}
            >
              {otpRequestId
                ? secondsUntilResend > 0
                  ? t("email.otp.resend_in_seconds", {
                      seconds: secondsUntilResend,
                    })
                  : t("email.otp.resend")
                : t("email.otp.send_code")}
            </button>
          )}
        </div>

        {!isVerified && otpRequestId ? (
          <div className="relative">
            <Input
              value={otpCode}
              onChange={(event) =>
                setOtpCode(sanitizeOtpCode(event.target.value))
              }
              placeholder={t("email.otp.verification_code_placeholder")}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="pr-10 text-sm/4"
              aria-label={t("email.otp.verification_code_aria_label")}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:opacity-50"
              disabled={isVerifying || otpCode.length === 0}
              aria-label={t("email.otp.verify")}
              onClick={() => {
                void verifyOtp();
              }}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <p className="text-sm text-destructive" aria-live="polite">
          {statusMessage ?? ""}
        </p>
      </div>
    </FormControl>
  );
}
