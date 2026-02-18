import { useEffect, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { Check } from "lucide-react";

import type { DeclarativeFieldComponentProps } from "../field-contract";
import { getOtpFieldNames, isOtpVerifiedValue } from "../otp-field-names";
import { Button, FormControl, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { sendEmailOtp, verifyEmailOtp } from "./email-otp.api";
import { OTP_MESSAGES } from "./email-otp.constants";
import { isEmailValid, sanitizeOtpCode, toFieldString } from "./email-otp.utils";

export function EmailField({
  field,
  controllerField,
  form,
  meta,
}: DeclarativeFieldComponentProps) {
  const otpEnabled = field.type === "email" && field.otp === true;
  const otpFieldNames = useMemo(() => getOtpFieldNames(field.id), [field.id]);

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
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);
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
    options: { shouldDirty: boolean; shouldTouch: boolean; shouldValidate: boolean }
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
    setStatusType(null);
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
      setStatusType("error");
      setStatusMessage(OTP_MESSAGES.invalidEmailBeforeSend);
      return;
    }

    setIsSending(true);
    setStatusMessage(null);
    setStatusType(null);

    try {
      const { requestId, resendAfterSeconds } = await sendEmailOtp({
        email: emailValue,
        fieldId: field.id,
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
      setStatusType("success");
      setStatusMessage(OTP_MESSAGES.sentSuccess);
    } catch (error) {
      setStatusType("error");
      setStatusMessage(
        error instanceof Error ? error.message : OTP_MESSAGES.sendFailed
      );
    } finally {
      setIsSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpRequestId) {
      setStatusType("error");
      setStatusMessage(OTP_MESSAGES.requestCodeFirst);
      return;
    }

    if (!otpCode.trim()) {
      setStatusType("error");
      setStatusMessage(OTP_MESSAGES.enterCode);
      return;
    }

    setIsVerifying(true);
    setStatusMessage(null);
    setStatusType(null);

    try {
      const { verificationToken } = await verifyEmailOtp({
        email: emailValue,
        fieldId: field.id,
        otp: otpCode.trim(),
        requestId: otpRequestId,
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
      setStatusType("success");
      setStatusMessage(OTP_MESSAGES.verifiedSuccess);
      setOtpCode("");
      form.trigger(field.id);
    } catch {
      setStatusType("error");
      setStatusMessage(OTP_MESSAGES.invalidCode);
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
          placeholder={field.placeholder || "Your answer"}
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
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              {...controllerField}
              className={cn("text-sm/4", {
                "bg-muted/60 border-muted-foreground/30 text-muted-foreground pr-10 cursor-not-allowed":
                  isVerified,
              })}
              placeholder={field.placeholder || "your@email.com"}
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
          </div>

          {!isVerified && (
            <Button
              type="button"
              variant="outline"
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
                  ? `Resend in ${secondsUntilResend}s`
                  : "Resend code"
                : "Send code"}
            </Button>
          )}
        </div>

        {!isVerified && otpRequestId ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={otpCode}
                onChange={(event) => setOtpCode(sanitizeOtpCode(event.target.value))}
                placeholder="Enter 6-digit code"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="text-sm/4"
                aria-label="Verification code"
              />
              <Button
                type="button"
                disabled={isVerifying || otpCode.length === 0}
                onClick={() => {
                  void verifyOtp();
                }}
              >
                Verify
              </Button>
            </div>
          </div>
        ) : null}

        {statusMessage && (
          <p
            className={cn("text-sm", {
              "text-destructive": statusType === "error",
              "text-muted-foreground": statusType === "success",
            })}
          >
            {statusMessage}
          </p>
        )}
      </div>
    </FormControl>
  );
}
