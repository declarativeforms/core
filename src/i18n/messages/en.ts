const enMessageSource = {
  "app.skip_to_main_content": "Skip to main content",
  "base.powered_by": "Powered by",
  "base.privacy_policy": "Privacy Policy",
  "hero.continue": "Continue",
  "main.form_not_found.title": "Form Not Found",
  "main.form_not_found.description":
    "The form you're looking for doesn't exist or has been removed.",
  "main.form_not_yet_open.title": "Form Not Yet Open",
  "main.form_not_yet_open.description":
    "This form is not yet accepting submissions.",
  "main.form_closed.title": "Form Closed",
  "main.form_closed.description":
    "This form is no longer accepting submissions.",
  "thank_you.page_title": "Thank You — Declarative Forms",
  "thank_you.default_title": "Thank You!",
  "thank_you.default_description": "Your submission has been received.",
  "section.back": "Back",
  "section.next": "Next",
  "dropdown.select_a": "Select a {label}",
  "dropdown.search": "Search...",
  "dropdown.no_results": "No results found.",
  "input.placeholder": "Your answer",
  "long_text.placeholder": "Your answer",
  "address.placeholder": "Enter address",
  "address.loading_suggestions": "Loading suggestions",
  "address.no_results": "No results found.",
  "email.placeholder_default": "Your answer",
  "email.placeholder_otp": "your@email.com",
  "email.otp.invalid_email_before_send":
    "Enter a valid email address before requesting a code.",
  "email.otp.send_failed": "Failed to send verification code.",
  "email.otp.request_code_first": "Request a verification code first.",
  "email.otp.enter_code": "Enter the verification code.",
  "email.otp.invalid_code": "Invalid verification code.",
  "email.otp.verification_code_placeholder": "Enter 6-digit code",
  "email.otp.verification_code_aria_label": "Verification code",
  "email.otp.send_code": "Send code",
  "email.otp.resend": "Resend",
  "email.otp.resend_in_seconds": "Resend in {seconds}s",
  "email.otp.verify": "Verify",
  "email.otp.request_failed": "Request failed. Please try again.",
  "email.otp.start_failed": "Could not start OTP verification.",
  "email.otp.token_missing": "OTP verification token is missing from response.",
  "connections.success_title": "Success",
  "connections.success_description":
    "Your connection has been successfully created. Use the ID below in your YAML configuration.",
  "connections.connection_id": "Connection ID",
  "connections.helper":
    "This ID connects your form to Airtable, GitHub, or Google Sheets.",
  "cookie.message": "We use cookies to improve your experience.",
  "cookie.learn_more": "Learn more",
  "cookie.decline": "Decline",
  "cookie.accept": "Accept",
  "privacy_policy.title": "Privacy Policy",
  "privacy_policy.back_home": "Back to Home",
  "geolocation.use_my_location": "Use my location",
  "geolocation.loading": "Getting location...",
  "geolocation.clear": "Clear",
  "geolocation.try_again": "Try again",
  "geolocation.location_captured": "Location captured successfully.",
  "geolocation.map_label": "Map showing your captured location",
  "geolocation.accuracy_very_precise": "Very precise",
  "geolocation.accuracy_precise": "Precise",
  "geolocation.accuracy_approximate": "Approximate",
  "geolocation.accuracy_less_accurate": "Less accurate",
  "geolocation.error_permission_denied":
    "Location access was denied. Please enable location permissions in your browser settings.",
  "geolocation.error_position_unavailable":
    "Your location could not be determined. Please try again.",
  "geolocation.error_timeout":
    "Location request timed out. Please try again.",
  "geolocation.error_not_supported":
    "Geolocation is not supported by your browser.",
} as const;

export type TranslationKey = keyof typeof enMessageSource;
export type TranslationMessages = Record<TranslationKey, string>;

export const enMessages: TranslationMessages = enMessageSource;
