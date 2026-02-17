import { useEffect, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { Check } from "lucide-react";

import type { DeclarativeFieldComponentProps } from "../field-contract";
import { Button, FormControl, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

const EMAIL_OTP_SEND_ENDPOINT =
  "https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/otp/email/send";
const EMAIL_OTP_VERIFY_ENDPOINT =
  "https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/otp/email/verify";
const OTP_DEFAULT_RESEND_COOLDOWN_SECONDS = 30;

type OtpSendResponse = {
  request_id?: string;
  requestId?: string;
  resend_after_seconds?: number;
  resendAfterSeconds?: number;
};

type OtpVerifyResponse = {
  verification_token?: string;
  verificationToken?: string;
};

function isEmailValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function toBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
  } catch {
    // no-op; fall back to default message below
  }

  return "Request failed. Please try again.";
}

export function EmailField({
  field,
  controllerField,
  form,
  meta,
}: DeclarativeFieldComponentProps) {
  const otpEnabled = field.type === "email" && field.otp === true;

  const otpVerifiedFieldName = `${field.id}__otp_verified`;
  const otpTokenFieldName = `${field.id}__otp_token`;
  const otpRequestIdFieldName = `${field.id}__otp_request_id`;

  useEffect(() => {
    if (!otpEnabled) {
      return;
    }

    form.register(otpVerifiedFieldName);
    form.register(otpTokenFieldName);
    form.register(otpRequestIdFieldName);

    const options = {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    } as const;

    if (form.getValues(otpVerifiedFieldName) === undefined) {
      form.setValue(otpVerifiedFieldName, false, options);
    }

    if (form.getValues(otpTokenFieldName) === undefined) {
      form.setValue(otpTokenFieldName, "", options);
    }

    if (form.getValues(otpRequestIdFieldName) === undefined) {
      form.setValue(otpRequestIdFieldName, "", options);
    }
  }, [
    form,
    otpEnabled,
    otpRequestIdFieldName,
    otpTokenFieldName,
    otpVerifiedFieldName,
  ]);

  const watchedVerified = useWatch({
    control: form.control,
    name: otpVerifiedFieldName,
  });
  const watchedToken = useWatch({
    control: form.control,
    name: otpTokenFieldName,
  });
  const watchedRequestId = useWatch({
    control: form.control,
    name: otpRequestIdFieldName,
  });

  const isVerified = toBoolean(watchedVerified);
  const otpRequestId =
    typeof watchedRequestId === "string" ? watchedRequestId : "";
  const otpToken = typeof watchedToken === "string" ? watchedToken : "";

  const emailValue = useMemo(() => {
    if (typeof controllerField.value === "string") {
      return controllerField.value;
    }
    if (controllerField.value === undefined || controllerField.value === null) {
      return "";
    }
    return String(controllerField.value);
  }, [controllerField.value]);

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

  const clearOtpState = () => {
    if (!otpEnabled) {
      return;
    }

    const options = {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    } as const;

    form.setValue(otpVerifiedFieldName, false, options);
    form.setValue(otpTokenFieldName, "", options);
    form.setValue(otpRequestIdFieldName, "", options);

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
      setStatusMessage("Enter a valid email address before requesting a code.");
      return;
    }

    setIsSending(true);
    setStatusMessage(null);
    setStatusType(null);

    try {
      const response = await fetch(EMAIL_OTP_SEND_ENDPOINT, {
        body: JSON.stringify({
          email: emailValue,
          field_id: field.id,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const payload = (await response.json()) as OtpSendResponse;

      const requestId =
        typeof payload.request_id === "string"
          ? payload.request_id
          : typeof payload.requestId === "string"
          ? payload.requestId
          : "";

      if (!requestId) {
        throw new Error("Could not start OTP verification.");
      }

      const resendAfterSeconds =
        typeof payload.resend_after_seconds === "number"
          ? payload.resend_after_seconds
          : typeof payload.resendAfterSeconds === "number"
          ? payload.resendAfterSeconds
          : OTP_DEFAULT_RESEND_COOLDOWN_SECONDS;

      const options = {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: false,
      } as const;

      form.setValue(otpVerifiedFieldName, false, options);
      form.setValue(otpTokenFieldName, "", options);
      form.setValue(otpRequestIdFieldName, requestId, options);

      setOtpCode("");
      setResendAvailableAt(Date.now() + Math.max(1, resendAfterSeconds) * 1000);
      setClockMs(Date.now());
      setStatusType("success");
      setStatusMessage("Verification code sent to your email.");
    } catch (error) {
      setStatusType("error");
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to send verification code."
      );
    } finally {
      setIsSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpRequestId) {
      setStatusType("error");
      setStatusMessage("Request a verification code first.");
      return;
    }

    if (!otpCode.trim()) {
      setStatusType("error");
      setStatusMessage("Enter the verification code.");
      return;
    }

    setIsVerifying(true);
    setStatusMessage(null);
    setStatusType(null);

    try {
      const response = await fetch(EMAIL_OTP_VERIFY_ENDPOINT, {
        body: JSON.stringify({
          email: emailValue,
          field_id: field.id,
          otp: otpCode.trim(),
          request_id: otpRequestId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const payload = (await response.json()) as OtpVerifyResponse;
      const verificationToken =
        typeof payload.verification_token === "string"
          ? payload.verification_token
          : typeof payload.verificationToken === "string"
          ? payload.verificationToken
          : "";

      if (!verificationToken) {
        throw new Error("OTP verification token is missing from response.");
      }

      const options = {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: true,
      } as const;

      form.setValue(otpVerifiedFieldName, true, options);
      form.setValue(otpTokenFieldName, verificationToken, options);
      setStatusType("success");
      setStatusMessage("Email address verified.");
      setOtpCode("");
      form.trigger(field.id);
    } catch {
      setStatusType("error");
      setStatusMessage("Invalid verification code.");
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
                onChange={(event) =>
                  setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
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
