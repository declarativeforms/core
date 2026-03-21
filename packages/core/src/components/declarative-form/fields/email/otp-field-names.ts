export type OtpFieldNames = {
  requestId: string;
  token: string;
  verified: string;
};

export function getOtpFieldNames(fieldId: string): OtpFieldNames {
  return {
    requestId: `${fieldId}__one_time_pin_request_id`,
    token: `${fieldId}__one_time_pin_token`,
    verified: `${fieldId}__one_time_pin_verified`,
  };
}

export function isOtpVerifiedValue(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}
