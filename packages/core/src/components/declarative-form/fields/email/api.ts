import {
  EMAIL_OTP_SEND_ENDPOINT,
  EMAIL_OTP_VERIFY_ENDPOINT,
  OTP_DEFAULT_RESEND_COOLDOWN_SECONDS,
} from './constants';

type OtpSendResponse = {
  request_id?: string;
  requestId?: string;
  resend_after_seconds?: number;
  resendAfterSeconds?: number;
};

type OtpVerifyResponse = {
  token?: string;
};

type OtpApiMessages = {
  requestFailed: string;
  startFailed: string;
  tokenMissing: string;
};

async function getErrorMessage(
  response: Response,
  messages: OtpApiMessages,
): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
  } catch {
    // Ignore parse failures and fall back to the default message.
  }

  return messages.requestFailed;
}

export async function sendEmailOtp(args: {
  email: string;
  fieldId: string;
  messages: OtpApiMessages;
}): Promise<{ requestId: string; resendAfterSeconds: number }> {
  const response = await fetch(EMAIL_OTP_SEND_ENDPOINT, {
    body: JSON.stringify({
      email_address: args.email,
      field_id: args.fieldId,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, args.messages));
  }

  const payload = (await response.json()) as OtpSendResponse;
  const requestId =
    typeof payload.request_id === 'string'
      ? payload.request_id
      : typeof payload.requestId === 'string'
        ? payload.requestId
        : '';

  if (!requestId) {
    throw new Error(args.messages.startFailed);
  }

  const resendAfterSeconds =
    typeof payload.resend_after_seconds === 'number'
      ? payload.resend_after_seconds
      : typeof payload.resendAfterSeconds === 'number'
        ? payload.resendAfterSeconds
        : OTP_DEFAULT_RESEND_COOLDOWN_SECONDS;

  return { requestId, resendAfterSeconds };
}

export async function verifyEmailOtp(args: {
  email: string;
  otp: string;
  requestId: string;
  messages: OtpApiMessages;
}): Promise<{ verificationToken: string }> {
  const response = await fetch(EMAIL_OTP_VERIFY_ENDPOINT, {
    body: JSON.stringify({
      email_address: args.email,
      request_id: args.requestId,
      secret: args.otp,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, args.messages));
  }

  const payload = (await response.json()) as OtpVerifyResponse;
  const verificationToken = typeof payload.token === 'string' ? payload.token : '';

  if (!verificationToken) {
    throw new Error(args.messages.tokenMissing);
  }

  return { verificationToken };
}
