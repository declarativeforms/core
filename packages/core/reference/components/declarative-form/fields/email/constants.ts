import { getBackendUrl } from "@/lib/api";

export const EMAIL_OTP_SEND_ENDPOINT = getBackendUrl("email-challenges/send");
export const EMAIL_OTP_VERIFY_ENDPOINT = getBackendUrl("email-challenges/verify");

export const OTP_DEFAULT_RESEND_COOLDOWN_SECONDS = 30;
