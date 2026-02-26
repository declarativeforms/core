import { getBackendUrl } from "@/lib/api";

export const EMAIL_OTP_SEND_ENDPOINT = getBackendUrl("otp/email/send");
export const EMAIL_OTP_VERIFY_ENDPOINT = getBackendUrl("otp/email/verify");

export const OTP_DEFAULT_RESEND_COOLDOWN_SECONDS = 30;
