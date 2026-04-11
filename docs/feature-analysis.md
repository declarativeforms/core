# Declarative Forms — Competitive Feature Analysis

> **Date**: April 11, 2026
> **Purpose**: Evaluate our form platform against competitors (Tally, Google Forms, Jotform, Typeform, etc.) to identify strengths, gaps, and priorities.
> **Methodology**: For each feature, we validated support in the codebase with two follow-up questions. Features are categorized as ✅ Supported, ⚠️ Partial, or ❌ Not Supported.

---

## Summary Dashboard

| Category | Supported | Partial | Not Supported | Total |
|----------|-----------|---------|---------------|-------|
| Form-Level Features | 10 | 2 | 5 | 17 |
| Platform-Level Features | 6 | 0 | 7 | 13 |
| Field-Level Features | 9 | 1 | 0 | 10 |
| **Total** | **25** | **3** | **12** | **40** |

**Overall Coverage: 62.5% fully supported, 7.5% partially supported, 30% gaps**

---

## Form-Level Features

### 1. ✅ Multi-Step Forms / Sections

**Status**: Fully Supported

Forms support multiple sections with linear or conditional navigation. Users progress through sections sequentially, and a "Back" button appears when there is section history.

**Follow-up 1: Can users go back to previous sections?**
> ✅ **Yes.** The runtime maintains a `sectionHistory` stack. The `go_back` action pops the last section from history and navigates back. A "Back" button is rendered conditionally when `sectionHistory.length > 0`.
>
> *Source: `packages/runtime/src/core/runtime.ts` (lines 154–170), `packages/core/src/components/declarative-form/core/section.component.tsx` (lines 68–76)*

**Follow-up 2: Is there a progress indicator (step counter, progress bar)?**
> ❌ **No.** There is no visual progress indicator showing the user's position within the form (e.g., "Step 2 of 5" or a progress bar). Section history is tracked internally but not surfaced in the UI.

**Gap**: Add a progress indicator component — this is standard in Typeform, Tally, and Jotform for multi-step forms.

---

### 2. ✅ Conditional Logic

**Status**: Fully Supported

JavaScript expressions power conditional field visibility (`visible_when`) and conditional section navigation (`next` with `when`/`go`/`else` rules).

**Follow-up 1: Can conditions be applied to both field visibility AND section routing?**
> ✅ **Yes.** Fields use `visible_when` expressions to show/hide dynamically. Sections use `next` arrays with `when`/`go` pairs for conditional routing, with an optional `else` fallback.
>
> *Source: `packages/types/src/form.ts` (lines 107, 186–194), `packages/runtime/src/core/runtime.ts` (lines 8–27)*

**Follow-up 2: What are the limitations of the expression syntax?**
> ⚠️ Expressions are raw JavaScript evaluated via `new Function("data", "return " + expression)`. Only the `data` object (form submission data) is available. No access to browser globals, Date utilities, or external functions. Failed evaluations are caught and logged but return `false` silently.
>
> *Source: `packages/common/src/expression.ts`*

**Gap**: Consider a safer, more user-friendly expression builder (drag-and-drop conditions) as competitors like Jotform and Tally offer visual condition builders.

---

### 3. ✅ Form Validation

**Status**: Fully Supported

Six validator types: `required`, `pattern` (regex), `min_length`, `max_length`, `min`, `max`, and `expression` (custom JS).

**Follow-up 1: Is real-time validation supported (on blur/on change)?**
> ❌ **No.** React Hook Form is used with default settings (submit-only validation). Fields are only validated when the user attempts to submit a section. On validation failure, the form scrolls to the first error field.
>
> *Source: `packages/core/src/components/declarative-form/core/section.component.tsx` (lines 27–29)*

**Follow-up 2: Can custom error messages be localized per language?**
> ✅ **Yes.** Each validator accepts an optional `message` property of type `ILocalizedText`, which can be a plain string or a `Record<string, string>` keyed by locale code. Default validation messages also support template interpolation with field labels and constraint values.
>
> *Source: `packages/types/src/form.ts` (lines 65–100), `packages/runtime/src/validation.ts`, `packages/runtime/src/messages.ts`*

**Gap**: Add on-blur or on-change validation mode — Google Forms and Typeform validate in real-time for a smoother UX.

---

### 4. ✅ Confirmation / Thank You Page

**Status**: Fully Supported

Customizable completion screen with title, description, and an optional button (with label and URL).

**Follow-up 1: Can the completion message vary based on responses?**
> ✅ **Yes.** Completion supports conditional rules — an array of `{ when, title, description, button }` objects. The runtime evaluates each `when` expression against form data and selects the first matching completion, with a fallback `else` option.
>
> *Source: `packages/runtime/src/compilation/completion.ts` (lines 30–38), `docs/examples/customize-the-thank-you-page.mdx`*

**Follow-up 2: Can users be redirected to an external URL?**
> ✅ **Yes.** The completion button can include a `url` property. Additionally, section `next` can be set to an external URL starting with `http`, triggering a redirect effect.
>
> *Source: `packages/core/src/pages/thank-you.page.tsx` (lines 92–97), `packages/types/src/form.ts` (lines 198–200)*

---

### 5. ✅ Form Scheduling / Availability Windows

**Status**: Fully Supported

Forms support `start_date` and `end_date` for time-based availability control.

**Follow-up 1: Are dates enforced in the UI?**
> ✅ **Yes.** The form renderer checks dates on load. If the current date is before `start_date`, it shows a "Form Not Yet Open" message. If after `end_date`, it shows "Form Closed."
>
> *Source: `packages/core/src/pages/main.page.tsx` (lines 271–289)*

**Follow-up 2: Can forms close after a certain number of submissions?**
> ❌ **No.** Only time-based scheduling is supported. There is no submission count limit or auto-close mechanism.

**Gap**: Add submission cap feature — Jotform and Google Forms support closing forms after N responses.

---

### 6. ✅ Partial Submissions / Auto-Save

**Status**: Fully Supported

Multi-step forms automatically save partial submissions as users progress through sections.

**Follow-up 1: How are partial submissions saved?**
> ✅ Each section submission sends data with `?partial=true` to the API. The submission is created or updated server-side, accumulating data across sections. The submission ID is tracked in the URL via `submission_id` query parameter.
>
> *Source: `packages/core/src/pages/main.page.tsx` (line 167), `packages/api/src/routes/forms-id-submissions-post.ts`*

**Follow-up 2: Can users resume a partially completed form?**
> ✅ **Yes.** The submission ID is passed as a URL parameter. When present, the form loads existing submission data and resumes from where the user left off.
>
> *Source: `packages/core/src/pages/main.page.tsx` (lines 170–173)*

---

### 7. ✅ Email Notifications on Submission

**Status**: Fully Supported

Email connections send notifications when forms are completed, using the Resend API.

**Follow-up 1: Can multiple email recipients be configured?**
> ❌ **No.** The `to` field is a single string. However, multiple separate email connections can be added to achieve sending to multiple recipients.
>
> *Source: `packages/types/src/form.ts` (line 223)*

**Follow-up 2: Can email body include field values via templates?**
> ✅ **Yes.** Subject, body, and even the recipient address support Handlebars-style template interpolation (`{{data.field_id}}`). The `include_responses` flag auto-generates an HTML table of all form responses.
>
> *Source: `packages/api/src/core/services/connections/email.ts`*

**Gap**: Support multiple recipients in a single `to` field (comma-separated or array) — this is standard in Jotform, Tally, and Google Forms.

---

### 8. ✅ Webhook Integrations

**Status**: Fully Supported

POST webhook connections send the full submission payload as JSON to a configured URL.

**Follow-up 1: Is there retry logic for failed deliveries?**
> ❌ **No.** Webhooks use a single `fetch()` call with no retry mechanism, exponential backoff, or failure logging. Failed deliveries are silently lost.
>
> *Source: `packages/api/src/core/services/connections/webhook.ts` (lines 11–17)*

**Follow-up 2: What data format is sent?**
> ✅ The complete `ISubmission` object is sent as JSON with `Content-Type: application/json`. This includes `id`, `data`, `status`, `created_at`, `updated_at`, and metadata (`ip_address`, `user_agent`).
>
> *Source: `packages/api/src/core/services/connections/webhook.ts`*

**Gap**: Implement webhook retry logic with exponential backoff and delivery status tracking — this is critical for production reliability.

---

### 9. ✅ Airtable Integration

**Status**: Fully Supported

OAuth 2.0 PKCE flow for Airtable with field mapping from form fields to Airtable columns.

**Follow-up 1: How does authentication work?**
> ✅ Full OAuth 2.0 with PKCE (Proof Key for Code Exchange). Users authorize via Airtable's OAuth flow, tokens are securely stored in MongoDB, and the integration creates records in specified bases/tables.
>
> *Source: `packages/api/src/routes/oauth-airtable-access-token-post.ts`, `packages/api/src/core/services/connections/airtable.ts`*

**Follow-up 2: Can connection triggers be conditional?**
> ✅ **Yes.** All connections (email, webhook, Airtable) support a `when` expression that is evaluated against submission data. The connection only fires if the expression is truthy.
>
> *Source: `packages/api/src/core/services/connections/process.ts`*

---

### 10. ⚠️ Form Sharing & Embedding

**Status**: Partially Supported

Forms can be shared via direct links and embedded via iframe with `?embed=true`.

**Follow-up 1: Is there an embed option?**
> ✅ **Yes.** Adding `?embed=true` to the form URL enables embed mode — removes padding, branding, and the "Powered by" footer. Suitable for iframe embedding.
>
> *Source: `packages/core/src/pages/main.page.tsx` (lines 35–36), `packages/core/src/pages/base.page.tsx` (lines 30–48)*

**Follow-up 2: Can forms be shared via custom domains?**
> ⚠️ **Partially.** Forms are served via `frms.dev` domain. GitHub-sourced forms support slug-based URLs (owner/repo/path). However, there is no custom domain mapping feature for studio forms.
>
> *Source: `packages/api/src/routes/forms-slug-get.ts`*

**Gap**: Add embeddable script tag option (not just iframe), custom domain support, and QR code generation — standard in Tally and Jotform.

---

### 11. ✅ Spam / Bot Protection

**Status**: Fully Supported

Cloudflare Turnstile CAPTCHA integration for bot protection.

**Follow-up 1: Are there other spam protection mechanisms beyond Turnstile?**
> ❌ **No.** Only Turnstile is implemented. No honeypot fields, rate limiting on submissions, or behavioral analysis.
>
> *Source: `packages/api/src/core/services/turnstile.ts`*

**Follow-up 2: Is IP-based abuse prevention available?**
> ⚠️ IP addresses are captured in submission metadata and passed to Turnstile verification, but no explicit IP-based rate limiting or blocking is implemented in the application layer.
>
> *Source: `packages/api/src/routes/forms-id-submissions-post.ts` (line 18)*

**Gap**: Add honeypot fields and submission rate limiting as additional layers — Jotform offers multiple spam protection methods.

---

### 12. ⚠️ Theming & Branding

**Status**: Partially Supported

Only primary color customization is available. The color is converted to CSS custom properties with auto-calculated foreground contrast.

**Follow-up 1: Can fonts, backgrounds, or layouts be customized?**
> ❌ **No.** The theme schema only supports `primary?: string`. No font family, background color/image, border radius, or layout options exist.
>
> *Source: `packages/types/src/form.ts` (lines 230–232), `packages/core/src/lib/theme.ts`*

**Follow-up 2: Can users add a logo or custom branding?**
> ❌ **No.** There is no logo upload, custom header, or branding removal option. All forms display a "Powered by Declarative Forms" footer.
>
> *Source: `packages/core/src/pages/base.page.tsx` (lines 68–85)*

**Gap**: This is a significant competitive weakness. Tally, Jotform, and Typeform all offer extensive theming (fonts, colors, backgrounds, logos, cover images, and branding removal on paid plans).

---

### 13. ✅ Multi-Language / Internationalization

**Status**: Fully Supported

Forms support localized content with runtime locale switching.

**Follow-up 1: How many languages are supported for UI strings?**
> 2 languages built-in: **English** and **Spanish**. The system is extensible — adding a new language requires creating a new message file and adding it to `SUPPORTED_LOCALES`.
>
> *Source: `packages/core/src/i18n/messages/en.ts`, `packages/core/src/i18n/messages/es.ts`, `packages/core/src/i18n/locales.ts`*

**Follow-up 2: Can form creators define translations for their content?**
> ✅ **Yes.** All text properties (labels, placeholders, descriptions, validation messages, completion text, email templates) accept `ILocalizedText` — either a plain string or a `Record<string, string>` keyed by locale. The locale resolution chain: exact match → base language → English → first available.
>
> *Source: `packages/types/src/form.ts` (line 1), `packages/common/src/localized-text.ts`*

**Gap**: Expand built-in UI translations beyond English and Spanish to cover major world languages.

---

### 14. ❌ Submission Data Export

**Status**: Not Supported

Submissions are viewable in the studio results panel but cannot be exported.

**Follow-up 1: Can submissions be exported as CSV or Excel?**
> ❌ **No.** The results panel shows a list of expandable submission items with raw JSON preview only. No CSV, Excel, or PDF export functionality exists.

**Follow-up 2: Are there aggregate analytics (charts, counts, completion rates)?**
> ❌ **No built-in analytics.** Mixpanel integration is available for external analytics (`page_view` and `section_completed` events are tracked), but the studio has no charts, response counts, or completion rate displays.

**Gap**: This is a critical competitive gap. Every major competitor (Google Forms, Tally, Jotform, Typeform) provides built-in response charts, CSV export, and basic analytics.

---

### 15. ❌ Form Templates in Studio

**Status**: Not Supported

10 YAML templates exist in the repository (`/templates/`) but are not accessible from the studio UI.

**Follow-up 1: Can users create forms from templates?**
> ❌ **No.** The studio dashboard only has a "New Form" button that creates a blank form from a hardcoded default. The 10 template files are for developer/YAML usage only.
>
> *Source: `packages/studio/src/pages/dashboard.page.tsx`, `packages/studio/src/lib/default-form.ts`*

**Follow-up 2: Can users save their own forms as reusable templates?**
> ❌ **No.** There is no "Save as template" or "Duplicate form" functionality.

**Gap**: Expose templates in the studio's form creation flow and add form duplication — Tally and Jotform prominently feature template galleries.

---

### 16. ❌ Form Duplication / Cloning

**Status**: Not Supported

**Follow-up 1: Can users duplicate an existing form?**
> ❌ **No.** The dashboard only supports creating new blank forms and deleting existing ones. No clone/duplicate action exists.

**Follow-up 2: Is there form versioning?**
> ⚠️ **Schema-level only.** The form schema includes a `version` field and `created_at`/`updated_at` timestamps, but there is no version history UI, undo/redo, or version comparison.
>
> *Source: `packages/types/src/form.ts` (line 238)*

**Gap**: Form duplication is a basic expectation. Add "Duplicate" action to the form context menu.

---

### 17. ❌ Form Access Control / Password Protection

**Status**: Not Supported

**Follow-up 1: Can forms be password-protected?**
> ❌ **No.** All published forms are publicly accessible. No password gate exists.

**Follow-up 2: Can forms be restricted to specific users?**
> ❌ **No.** There is no per-form access control, login requirement, or invite-only restriction. The only gating mechanism is the date-based availability window.

**Gap**: Add password protection at minimum — Jotform, Tally, and Google Forms all support this.

---

---

## Platform-Level Features

### 18. ✅ User Authentication (Studio)

**Status**: Fully Supported

Studio supports GitHub OAuth and magic link email sign-in with JWT session tokens.

**Follow-up 1: What authentication methods are available?**
> ✅ Three methods: **GitHub OAuth 2.0**, **Magic Link Email** (10-minute expiry, 30-second cooldown), and **Demo auth** (ephemeral testing). JWT tokens have 7-day expiry.
>
> *Source: `packages/api/src/routes/auth-github-post.ts`, `packages/api/src/routes/auth-magic-link-send-post.ts`, `packages/api/src/routes/auth-magic-link-verify-post.ts`*

**Follow-up 2: Is there session management?**
> ⚠️ JWT-based with 7-day expiry. No explicit session revocation, refresh tokens, or "logged in devices" management.

---

### 19. ✅ API / Developer Access

**Status**: Fully Supported

Full REST API with Swagger/OpenAPI documentation.

**Follow-up 1: Is there API documentation?**
> ✅ **Yes.** Fastify Swagger plugin generates interactive API docs at the `/docs` route. Routes include schema definitions with tags, summaries, and request/response types.
>
> *Source: `packages/api/src/server.ts` (lines 68–91)*

**Follow-up 2: Can forms be managed programmatically?**
> ✅ **Yes.** Complete CRUD API for forms, submissions, file uploads, and authentication. Forms can be defined in YAML/JSON and managed via GitHub repositories as well.
>
> *Source: `packages/api/src/routes/`*

---

### 20. ✅ Form Builder (Visual Editor)

**Status**: Fully Supported

Web-based studio with section and field management, property panels, and auto-save.

**Follow-up 1: Does the builder support drag-and-drop field reordering?**
> ❌ **No.** Fields and sections are reordered using up/down chevron buttons rather than true drag-and-drop. The `@dnd-kit` library is installed but field reordering in the builder uses button-based movement.
>
> *Source: `packages/studio/src/components/form-builder/section-field.tsx`*

**Follow-up 2: Is there auto-save?**
> ✅ **Yes.** The studio uses a debounce pattern — changes trigger a 1-second timer before auto-saving to the backend. The UI shows "Saving..." / "Saved" / "Unsaved changes" states.
>
> *Source: `packages/studio/src/pages/form-editor.page.tsx` (lines 204–243)*

**Gap**: Implement true drag-and-drop for fields — all major competitors support this.

---

### 21. ❌ Collaboration / Team Management

**Status**: Not Supported

**Follow-up 1: Can multiple users collaborate on the same form?**
> ❌ **No.** Each user has a personal dashboard. No shared workspaces, collaborator invites, or real-time co-editing.

**Follow-up 2: Is there team/workspace management?**
> ❌ **No.** No teams, organizations, roles, or permissions system beyond individual user authentication.

**Gap**: Team features are essential for business users. Jotform, Tally (Teams), and Google Forms all support shared access.

---

### 22. ❌ Submission Data Analytics

**Status**: Not Supported (Mixpanel integration only)

**Follow-up 1: Are there built-in charts or visualizations?**
> ❌ **No.** The results panel only lists individual submissions. No pie charts, bar graphs, or summary statistics.

**Follow-up 2: Is there response count tracking?**
> ❌ **No.** No submission count display on the dashboard or form settings. The only analytics option is connecting Mixpanel externally.
>
> *Source: `packages/studio/src/components/results-panel.tsx`*

**Gap**: Critical gap. Google Forms auto-generates response charts. Tally shows response counts on the dashboard. This should be a high priority.

---

### 23. ❌ Payment Processing

**Status**: Not Supported

**Follow-up 1: Is there Stripe or PayPal integration?**
> ❌ **No.** No payment-related code exists in the repository.

**Follow-up 2: Can order totals be calculated?**
> ❌ **No.** No pricing fields, quantity selectors, or calculation logic.

**Gap**: Payment fields are a major differentiator for Jotform and Typeform. Consider Stripe integration.

---

### 24. ❌ Custom CSS / Advanced Styling

**Status**: Not Supported

**Follow-up 1: Can form creators add custom CSS?**
> ❌ **No.** Forms use Tailwind CSS internally with no custom CSS injection point for form creators.

**Follow-up 2: Are there layout options (multi-column)?**
> ❌ **No.** All forms render in a single-column layout. No grid, multi-column, or side-by-side field placement options.

**Gap**: At minimum, offer a few pre-built themes/styles. Typeform and Jotform offer extensive visual customization.

---

### 25. ❌ Form Prefill from External Data

**Status**: Not Supported

**Follow-up 1: Can forms integrate with external databases for prefilling?**
> ❌ **No.** No external data source integration for form prefilling.

**Follow-up 2: Can dropdown options be populated dynamically from an API?**
> ❌ **No.** All field options (dropdown, select) are statically defined in the form schema.
>
> *Source: `packages/types/src/form.ts` (lines 116–120)*

**Gap**: Dynamic data population is important for enterprise use cases. Jotform supports this via integrations.

---

### 26. ❌ Submission Limits & Duplicate Prevention

**Status**: Not Supported

**Follow-up 1: Can a max number of submissions be set?**
> ❌ **No.** No submission cap mechanism exists.

**Follow-up 2: Can duplicate submissions be prevented?**
> ⚠️ **Partially.** There is a guard against re-completing an already-completed submission (server-side check returns existing submission), but no prevention of the same user/IP submitting a new form multiple times.
>
> *Source: `packages/api/src/core/services/submissions.ts` (lines 150–152)*

**Gap**: Submission limits and one-response-per-user are common in Google Forms and Tally.

---

### 27. ✅ Form Preview

**Status**: Fully Supported

**Follow-up 1: Can forms be previewed before publishing?**
> ✅ **Yes.** The studio editor includes a preview capability via the share link. Forms can be viewed at their public URL while still editing.
>
> *Source: `packages/studio/src/components/share-panel.tsx`*

**Follow-up 2: Is there a live preview in the builder?**
> ❌ **No.** There is no side-by-side or split-screen live preview within the builder itself. Users must open the form URL separately.

**Gap**: Add inline preview panel in the builder — Tally shows real-time preview alongside the editor.

---

### 28. ❌ Undo/Redo in Builder

**Status**: Not Supported

**Follow-up 1: Can users undo changes in the form builder?**
> ❌ **No.** No undo/redo stack or version history is maintained.

**Follow-up 2: Is there change history or audit log?**
> ❌ **No.** Only `updated_at` timestamp is tracked. No change diff, revision history, or audit trail.

**Gap**: Undo/redo is standard UX for builder tools. Should be implemented.

---

### 29. ✅ Responsive / Mobile-First Design

**Status**: Fully Supported

**Follow-up 1: Are forms mobile-optimized?**
> ✅ **Yes.** Forms use Tailwind CSS with responsive utilities. Touch-friendly controls, proper input types, and mobile-specific handling for camera, signatures, and file uploads.

**Follow-up 2: Are there mobile-specific optimizations?**
> ✅ **Yes.** Camera field handles `OverconstrainedError` gracefully for mobile devices. OTP input uses `inputMode="numeric"` and `autoComplete="one-time-code"` for iOS/Android auto-fill. Signature canvas scales with `devicePixelRatio` for retina displays.
>
> *Source: Various field components in `packages/core/src/components/declarative-form/fields/`*

---

### 30. ❌ White-Label / Branding Removal

**Status**: Not Supported

**Follow-up 1: Can the "Powered by" footer be removed?**
> ❌ **No.** The footer is hardcoded in the base page. The only case where it's hidden is in embed mode.
>
> *Source: `packages/core/src/pages/base.page.tsx` (lines 68–85)*

**Follow-up 2: Can custom logos be added to forms?**
> ❌ **No.** No logo field in the form schema or theme configuration.

**Gap**: White-labeling is a premium feature on Tally, Jotform, and Typeform. Critical for business customers.

---

## Field-Level Features

### 31. ✅ Required Field Indicators

**Status**: Fully Supported

**Follow-up 1: Are required fields visually marked?**
> ✅ **Yes.** Required fields display a red asterisk (`*`) next to the label, properly marked with `aria-hidden="true"` for accessibility.
>
> *Source: `packages/core/src/components/declarative-form/core/field.component.tsx` (lines 20–24)*

**Follow-up 2: Can the required message be customized?**
> ✅ **Yes.** The `required` validator accepts a `message` property supporting localized text. Default message: "This field is required."
>
> *Source: `packages/types/src/form.ts` (lines 66–70), `packages/runtime/src/messages.ts`*

---

### 32. ✅ File Upload

**Status**: Fully Supported

Drag-and-drop file upload with S3 storage, progress tracking, and file previews.

**Follow-up 1: Can file types be restricted?**
> ❌ **No.** All file types are accepted. There is no `accept` attribute or MIME type filtering configuration in the schema.

**Follow-up 2: Is there drag-and-drop with progress indication?**
> ✅ **Yes.** Full drag-and-drop support with `onDrop`/`onDragOver`/`onDragLeave` handlers. Progress bar with percentage and ARIA `role="progressbar"`. File previews with type-specific icons (image, video, audio, PDF, archive).
>
> *Source: `packages/core/src/components/declarative-form/fields/file-upload/file-upload-field.component.tsx`, `packages/core/src/components/declarative-form/fields/file-upload/file-preview.component.tsx`*

**Gap**: Add file type restriction option — important for job applications (PDF only), image uploads, etc.

---

### 33. ✅ Email Field with OTP Verification

**Status**: Fully Supported

Email fields support optional OTP (one-time pin) verification and free email domain blocking.

**Follow-up 1: How does the OTP flow work?**
> ✅ User enters email → clicks "Send code" → receives 6-digit OTP via email → enters code → clicks verify. Verification token is stored as hidden field data and validated server-side on form submission.
>
> *Source: `packages/core/src/components/declarative-form/fields/email-field.component.tsx`*

**Follow-up 2: Is there rate limiting?**
> ✅ **Yes.** 30-second cooldown between OTP sends. Resend button is disabled with a countdown timer ("Resend in X seconds").
>
> *Source: `packages/core/src/components/declarative-form/fields/email/constants.ts` (line 6)*

---

### 34. ✅ Address Autocomplete

**Status**: Fully Supported

Google Places API integration with structured and string output formats.

**Follow-up 1: What autocomplete provider is used?**
> ✅ Google Places API with debounced search (300ms). Supports different autocomplete types: full address, locality, region, and country.
>
> *Source: `packages/core/src/lib/google-places.ts`*

**Follow-up 2: Can addresses be captured in structured format?**
> ✅ **Yes.** Two output formats: `"string"` (formatted address text) and `"structured"` (individual components: street, city, state, country, postal code).
>
> *Source: `packages/types/src/form.ts` (lines 128–135)*

---

### 35. ✅ Signature Capture

**Status**: Fully Supported

Canvas-based signature drawing with high-DPI support.

**Follow-up 1: How are signatures stored?**
> ✅ Drawn on HTML5 Canvas, converted to PNG blob, uploaded as a file (S3 storage). Stored as `"signature.png"`.
>
> *Source: `packages/core/src/components/declarative-form/fields/signature-field.component.tsx` (lines 95–115)*

**Follow-up 2: Can users redo their signature?**
> ✅ **Yes.** A "Clear" button resets the canvas and form value, allowing the user to draw again.
>
> *Source: `packages/core/src/components/declarative-form/fields/signature-field.component.tsx` (line 195)*

---

### 36. ✅ Camera / Photo Capture

**Status**: Fully Supported

Live camera stream with configurable facing mode and retake capability.

**Follow-up 1: Can users switch between front and rear cameras?**
> ✅ **Yes.** The `facing_mode` property accepts `"front"` or `"rear"`, mapped to `"user"` and `"environment"` media constraints. Graceful fallback for devices with `OverconstrainedError`.
>
> *Source: `packages/core/src/components/declarative-form/fields/camera-field.component.tsx` (lines 48–72)*

**Follow-up 2: Can users retake photos?**
> ✅ **Yes.** After capture, a "Retake" button resets the camera to live preview state for recapture.
>
> *Source: `packages/core/src/components/declarative-form/fields/camera-field.component.tsx` (lines 118–120)*

---

### 37. ✅ Rating Field

**Status**: Fully Supported

Configurable star rating with custom ranges and labels.

**Follow-up 1: What scales are supported?**
> ✅ Any custom range via `min` and `max` validators. Default is 1–5. Can be configured as 1–10, 1–3, or any other range.
>
> *Source: `packages/runtime/src/validation.ts` (lines 55–72)*

**Follow-up 2: Can labels be customized?**
> ✅ **Yes.** `min_label` and `max_label` properties support localized text (e.g., "Not likely" to "Very likely").
>
> *Source: `packages/types/src/form.ts` (lines 122–126)*

---

### 38. ✅ Dropdown with Search

**Status**: Fully Supported

Searchable dropdown using Radix Command component with typeahead filtering.

**Follow-up 1: Is search filtering available?**
> ✅ **Yes.** When `searchable: true` is set, the dropdown renders a `SearchableDropdown` with a `CommandInput` for filtering options by text.
>
> *Source: `packages/core/src/components/declarative-form/fields/dropdown-field.component.tsx` (lines 35–42, 68–130)*

**Follow-up 2: Is "Other" option with custom input available?**
> ⚠️ **Not for dropdowns.** The `allow_other` property with custom text input is only available for `single_select` and `multiple_select` fields. Dropdown fields do not support this.
>
> *Source: `packages/core/src/components/declarative-form/fields/multiple-select-field.component.tsx`*

---

### 39. ✅ Hidden Fields

**Status**: Fully Supported

Hidden fields capture context data invisibly.

**Follow-up 1: Can hidden fields capture URL parameters?**
> ✅ **Yes.** All non-reserved URL query parameters are automatically mapped to form initial data. Hidden fields can receive these values.
>
> *Source: `packages/core/src/pages/main.page.tsx` (lines 101–110)*

**Follow-up 2: Are hidden values included in submissions and webhooks?**
> ✅ **Yes.** All form data, including hidden fields, is persisted and sent in webhook payloads.
>
> *Source: `packages/api/src/core/services/connections/webhook.ts`*

---

### 40. ⚠️ Accessibility (WCAG Compliance)

**Status**: Partially Supported

Good foundation with ARIA attributes but incomplete keyboard navigation.

**Follow-up 1: Are ARIA attributes properly used?**
> ✅ **Yes.** Extensive use of `aria-label`, `aria-live="polite"`, `aria-busy`, `aria-invalid`, `role="group"`, `role="combobox"`, `role="alert"`, and `aria-hidden` throughout field components.
>
> *Source: Various components in `packages/core/src/components/declarative-form/fields/`*

**Follow-up 2: Is keyboard navigation fully supported?**
> ⚠️ **Partially.** Standard form controls (inputs, buttons, selects) support keyboard navigation via native HTML. Custom components like signature canvas and camera field have limited keyboard accessibility. Focus management is handled for file upload validation scrolling.

**Gap**: Full WCAG 2.1 AA compliance audit recommended. Ensure all custom interactive components support keyboard-only operation.

---

## Priority Gap Summary

### 🔴 Critical Gaps (Table Stakes — Competitors All Have These)

| # | Feature | Competitors |
|---|---------|-------------|
| 1 | **Submission Data Export (CSV/Excel)** | Google Forms, Tally, Jotform, Typeform |
| 2 | **Built-in Response Analytics / Charts** | Google Forms, Tally, Jotform |
| 3 | **Form Templates Gallery in Studio** | Tally, Jotform, Typeform |
| 4 | **Form Duplication / Cloning** | All competitors |
| 5 | **Progress Indicator for Multi-Step Forms** | Typeform, Tally, Jotform |
| 6 | **Real-time Field Validation (on blur)** | Google Forms, Typeform |

### 🟡 Important Gaps (Differentiation & Business Value)

| # | Feature | Competitors |
|---|---------|-------------|
| 7 | **Extended Theming (fonts, backgrounds, logos)** | Tally, Typeform, Jotform |
| 8 | **White-Label / Remove Branding** | Tally Pro, Jotform, Typeform |
| 9 | **Team Collaboration / Shared Workspaces** | Tally Teams, Jotform, Google Forms |
| 10 | **Webhook Retry Logic** | Tally, Jotform |
| 11 | **Drag-and-Drop in Form Builder** | All competitors |
| 12 | **Submission Limits / Duplicate Prevention** | Google Forms, Jotform |
| 13 | **Password-Protected Forms** | Jotform, Tally |

### 🟢 Nice-to-Have Gaps (Competitive Advantage)

| # | Feature | Competitors |
|---|---------|-------------|
| 14 | **Payment Integration (Stripe)** | Jotform, Typeform |
| 15 | **Custom CSS Injection** | Jotform |
| 16 | **Dynamic Dropdown Options from API** | Jotform |
| 17 | **File Type Restrictions** | Google Forms, Jotform |
| 18 | **Multiple Email Recipients** | All competitors |
| 19 | **Undo/Redo in Builder** | Tally |
| 20 | **Live Preview in Builder** | Tally |
| 21 | **More Built-in UI Languages** | Typeform, Jotform |

---

## Strengths vs. Competitors

### Where Declarative Forms Excels

1. **YAML-First / Code-as-Config** — Unique advantage over all competitors. Forms can be version-controlled in Git repositories.
2. **Expression-Powered Logic** — Full JavaScript expressions for visibility, routing, and validation exceed the visual rule builders of competitors.
3. **Email OTP Verification** — Built-in email verification at field level is rare among competitors.
4. **Camera & Signature Fields** — Native camera capture and signature drawing are typically add-ons or premium features elsewhere.
5. **Geolocation with Map Preview** — GPS capture with Leaflet map display is uncommon.
6. **Address Autocomplete Variants** — Four address field types (full, locality, region, country) with structured output is comprehensive.
7. **Partial Submission Tracking** — Automatic progress saving across sections with resume capability.
8. **Airtable OAuth Integration** — Direct Airtable connection with OAuth PKCE is well-implemented.
9. **API-First Architecture** — Clean REST API with Swagger docs enables powerful integrations.
10. **Conditional Completion Pages** — Dynamic thank-you pages based on form responses is a thoughtful feature.
