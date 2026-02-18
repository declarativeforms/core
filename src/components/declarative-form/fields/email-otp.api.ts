import {
  EMAIL_OTP_SEND_ENDPOINT,
  EMAIL_OTP_VERIFY_ENDPOINT,
  OTP_DEFAULT_RESEND_COOLDOWN_SECONDS,
  OTP_MESSAGES,
} from "./email-otp.constants";

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

export async function sendEmailOtp(args: {
  email: string;
  fieldId: string;
}): Promise<{ requestId: string; resendAfterSeconds: number }> {
  const response = await fetch(EMAIL_OTP_SEND_ENDPOINT, {
    body: JSON.stringify({
      email: args.email,
      field_id: args.fieldId,
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

  return { requestId, resendAfterSeconds };
}

export async function verifyEmailOtp(args: {
  email: string;
  fieldId: string;
  otp: string;
  requestId: string;
}): Promise<{ verificationToken: string }> {
  const response = await fetch(EMAIL_OTP_VERIFY_ENDPOINT, {
    body: JSON.stringify({
      email: args.email,
      field_id: args.fieldId,
      otp: args.otp,
      request_id: args.requestId,
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
    throw new Error(OTP_MESSAGES.tokenMissing);
  }

  return { verificationToken };
}
