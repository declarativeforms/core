import { getBackendUrl } from '../../../../lib/api';

export function getEmailOtpSendEndpoint(): string {
  return getBackendUrl('email-challenges/send');
}

export function getEmailOtpVerifyEndpoint(): string {
  return getBackendUrl('email-challenges/verify');
}

export const OTP_DEFAULT_RESEND_COOLDOWN_SECONDS = 30;
