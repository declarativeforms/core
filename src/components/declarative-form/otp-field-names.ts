export type OtpFieldNames = {
  requestId: string;
  token: string;
  verified: string;
};

export function getOtpFieldNames(fieldId: string): OtpFieldNames {
  return {
    requestId: `${fieldId}__otp_request_id`,
    token: `${fieldId}__otp_token`,
    verified: `${fieldId}__otp_verified`,
  };
}

export function isOtpVerifiedValue(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}
