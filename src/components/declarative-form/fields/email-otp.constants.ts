export const EMAIL_OTP_SEND_ENDPOINT =
  "https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/otp/email/send";
export const EMAIL_OTP_VERIFY_ENDPOINT =
  "https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/otp/email/verify";

export const OTP_DEFAULT_RESEND_COOLDOWN_SECONDS = 30;

export const OTP_MESSAGES = {
  enterCode: "Enter the verification code.",
  invalidCode: "Invalid verification code.",
  invalidEmailBeforeSend: "Enter a valid email address before requesting a code.",
  requestCodeFirst: "Request a verification code first.",
  sendFailed: "Failed to send verification code.",
  sentSuccess: "Verification code sent to your email.",
  tokenMissing: "OTP verification token is missing from response.",
  verifiedSuccess: "Email address verified.",
} as const;
