# Persona Journey Analysis — Competitive Advantage Evaluation

> **Date**: April 11, 2026
> **Purpose**: Evaluate the Declarative Forms platform from the perspective of three key personas / ICPs, walking through realistic use-case scenarios step by step to validate that our product meets their needs and to surface any friction or gaps.

---

## Table of Contents

1. [Persona 1: Small Business Owner / Solopreneur](#persona-1-small-business-owner--solopreneur)
   - Scenario 1.1: Launching a contact form on their website
   - Scenario 1.2: Collecting event registrations with a deadline
   - Scenario 1.3: Running a customer feedback survey after purchase
   - Scenario 1.4: Accepting job applications for a new hire
2. [Persona 2: Developer / Technical Founder](#persona-2-developer--technical-founder)
   - Scenario 2.1: Embedding a form in a SaaS product via API
   - Scenario 2.2: Building multi-step onboarding with conditional logic
   - Scenario 2.3: Integrating form submissions into an automation pipeline
3. [Persona 3: Operations / People Ops Manager](#persona-3-operations--people-ops-manager)
   - Scenario 3.1: Employee onboarding data collection
   - Scenario 3.2: Internal support request / IT ticket form
   - Scenario 3.3: Collecting field data with signatures and photos
4. [Cross-Persona Summary](#cross-persona-summary)

---

## Persona 1: Small Business Owner / Solopreneur

**Profile**: Sarah, 34, runs a boutique marketing agency with 5 employees. She is not technical — she uses tools like Canva, Mailchimp, and Notion. She needs forms for lead capture, event registration, client feedback, and hiring. She wants something that looks professional, is easy to set up, and "just works."

**Key Expectations**:
- Quick setup (under 10 minutes for a basic form)
- Professional, branded appearance
- Share via link or embed on website
- Get email notifications when someone submits
- See responses in a simple dashboard
- Export data to spreadsheet for further analysis

---

### Scenario 1.1: Launching a Contact Form on Her Website

**Goal**: Sarah wants a simple contact form (name, email, message) embedded on her agency website. She wants to be notified by email when someone submits and to view all responses.

#### Step-by-Step Journey

| Step | User Action | Platform Response | Status |
|------|-------------|-------------------|--------|
| 1 | Sarah navigates to the Studio login page | Login page with GitHub OAuth and Magic Link email options | ✅ **Supported** — Magic link is great for non-technical users who may not have GitHub |
| 2 | She clicks "Continue with Email", enters her email | Magic link sent; she receives email within seconds | ✅ **Supported** |
| 3 | She clicks the link in her email | Authenticated, redirected to Dashboard | ✅ **Supported** |
| 4 | She sees the dashboard and clicks "New Form" | A new form is created with a default "Personal Information" section (first name, last name, email) | ⚠️ **Friction** — She gets a blank template. She would prefer to pick from pre-built templates like "Contact Form", "Feedback", etc. She now has to build from scratch. |
| 5 | She edits the form title to "Contact Us" and adds a description | Title and description fields are editable in Settings tab | ✅ **Supported** |
| 6 | She wants to add a "Message" long text field | She navigates to the Edit tab, selects her section, clicks "Add Field", selects "long_text", labels it "Message" | ✅ **Supported** |
| 7 | She marks all fields as required | Each field has a "Required" checkbox in the validators section | ✅ **Supported** |
| 8 | She wants to set her brand color (orange, #FF6B00) | She goes to Settings tab and uses the color picker to set primary color | ✅ **Supported** |
| 9 | She wants to add her agency logo at the top of the form | ❌ **Not possible** — no logo upload or custom branding beyond primary color | ❌ **Gap** |
| 10 | She wants to customize the font to match her brand | ❌ **Not possible** — no font customization | ❌ **Gap** |
| 11 | She sets up an email notification to herself | She goes to Connections tab, adds an Email connection with her email, subject template, and `include_responses: true` | ✅ **Supported** |
| 12 | She wants to also notify her assistant | She would need to add a second email connection — the `to` field only accepts one address | ⚠️ **Friction** — Works via workaround (duplicate connection) but not intuitive |
| 13 | She previews the form by clicking "Open Form" | Form opens in new tab at `frms.dev/{id}` | ✅ **Supported** |
| 14 | She wants to embed the form on her Squarespace website | She copies the share URL. For embedding, she needs to add `?embed=true` to the URL and use an iframe | ⚠️ **Friction** — No copy-paste embed code snippet. She has to know to construct the iframe HTML herself |
| 15 | Form is live. A lead submits the form | Submission processed, email notification sent | ✅ **Supported** |
| 16 | She goes to the Results tab to view the submission | She sees the submission listed with ID, date, and status. She clicks to expand and sees raw JSON | ⚠️ **Friction** — JSON is not user-friendly for a non-technical person. She expected a clean table view |
| 17 | She wants to export all responses to a spreadsheet | ❌ **Not possible** — no CSV/Excel export | ❌ **Gap** |
| 18 | She wants to see how many people have viewed vs. submitted the form | ❌ **Not possible** — no built-in analytics (would need external Mixpanel setup) | ❌ **Gap** |

#### Outcome Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Can she achieve her goal?** | ⚠️ Partially | Core form works, but branding, embedding UX, results viewing, and export are lacking |
| **Time to completion** | ~15 min | Could be 5 min with a template |
| **Professional appearance** | ⚠️ Limited | Color only. No logo, no custom fonts, "Powered by" footer visible |
| **Competitive comparison** | Behind | Tally, Jotform, and Google Forms all offer branded forms, templates, clean results tables, and CSV export out of the box |

---

### Scenario 1.2: Collecting Event Registrations with a Deadline

**Goal**: Sarah is hosting a workshop. She needs a registration form that opens April 1, closes April 14, collects attendee info and session preferences, and sends confirmations.

#### Step-by-Step Journey

| Step | User Action | Platform Response | Status |
|------|-------------|-------------------|--------|
| 1 | She creates a new form and titles it "Workshop Registration" | New blank form created | ✅ **Supported** (but she'd prefer the "Event Registration" template) |
| 2 | She builds the attendee section: name, email, company, dietary requirements | She uses short_text, email, dropdown fields | ✅ **Supported** — all field types available |
| 3 | She adds a second section for session preferences | She clicks "Add Section", adds a multiple_select field for sessions | ✅ **Supported** — multi-step forms with sections |
| 4 | She wants attendees to select at least 1 session | She adds a `min: 1` validator to the multiple_select | ✅ **Supported** |
| 5 | She wants to allow attendees to suggest their own session topic | She enables `allow_other: true` on the multiple_select | ✅ **Supported** — custom "Other" input |
| 6 | She wants to set registration open: April 1, close: April 14 | She looks for date settings in Settings tab | ❌ **Gap** — The start/end date UI fields are **commented out / disabled** in the Studio. The schema supports these fields but the form builder doesn't expose them. She would need to edit YAML directly. |
| 7 | She wants the form to close after 50 registrations | ❌ **Not possible** — no submission cap feature | ❌ **Gap** |
| 8 | She configures a confirmation email to attendees using `to: "{{data.email}}"` | Dynamic recipient via template interpolation | ✅ **Supported** |
| 9 | She customizes the completion page with "You are registered!" and a button linking to event details | Completion editor supports title, message, button label, and button URL | ✅ **Supported** |
| 10 | She wants to connect to Airtable to track registrations | Airtable connection requires OAuth setup with connection_id, base_id, table_id | ⚠️ **Friction** — Requires knowing Airtable API details. No guided setup wizard |
| 11 | She shares the form link and registrations come in | Submissions processed, emails sent, Airtable records created | ✅ **Supported** |
| 12 | She wants to see total registration count at a glance | ❌ **Not possible** — Results tab shows individual submissions, no count or summary | ❌ **Gap** |
| 13 | She wants to export registrations for her event planning spreadsheet | ❌ **Not possible** — no export | ❌ **Gap** |

#### Outcome Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Can she achieve her goal?** | ⚠️ Partially | Form creation and email work, but scheduling dates can't be set in UI and no export/counts |
| **Missing critical features** | Start/end date UI, submission cap, export, response counts |
| **Competitive comparison** | Behind | Google Forms has response limits, Tally has scheduling, Jotform has all of these |

---

### Scenario 1.3: Running a Customer Feedback Survey After Purchase

**Goal**: Sarah wants to send a satisfaction survey to clients. If they rate low, she wants to collect more details and be alerted. If they rate high, she wants a simple thank-you.

#### Step-by-Step Journey

| Step | User Action | Platform Response | Status |
|------|-------------|-------------------|--------|
| 1 | She creates a new form with a "Rating" section | She adds a `rating` field with min_label "Poor" and max_label "Excellent" | ✅ **Supported** |
| 2 | She wants to add a "Would you recommend us?" question | She adds a `single_select` with Yes/No/Maybe options | ✅ **Supported** |
| 3 | She wants low-rating respondents (≤2) to see a follow-up section asking what went wrong | She configures conditional section navigation: `when: "data.overall_rating <= 2"` → go to "concerns" section, `else` → "done" | ✅ **Supported** — Full conditional branching |
| 4 | In the concerns section, she wants to ask "Would you like us to contact you?" and conditionally show an email field | She sets `visible_when: "data.contact_me === 'Yes, please reach out'"` on the email field | ✅ **Supported** — Conditional field visibility |
| 5 | She wants different thank-you messages based on the rating | She switches to conditional completion: one rule for `data.overall_rating <= 2` (apologetic) and a default (grateful) | ✅ **Supported** — Conditional completion messages |
| 6 | She wants to be alerted via Slack when someone rates ≤2 | She adds a webhook connection with `when: "data.overall_rating <= 2"` pointing to a Zapier/Make webhook that posts to Slack | ✅ **Supported** — Conditional webhook triggers |
| 7 | She wants to see the average satisfaction rating | ❌ **Not possible** — no aggregate analytics | ❌ **Gap** |
| 8 | She wants a progress bar so respondents know they're 50% done after the first section | ❌ **Not possible** — no progress indicator for multi-step forms | ❌ **Gap** |
| 9 | She shares the form link via email to her client list | Form accessible at public URL | ✅ **Supported** |
| 10 | She wants to pre-fill the client's name from the email link | She uses query parameters: `?full_name=Sarah%20Jones` | ✅ **Supported** — URL parameter prefill |

#### Outcome Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Can she achieve her goal?** | ✅ Mostly yes | Conditional logic, branching, and webhooks work excellently. Missing analytics and progress indicator |
| **Standout strength** | Conditional logic is powerful — section routing, field visibility, completion messages, and webhook triggers all support expressions |
| **Competitive comparison** | Competitive | Logic engine rivals Typeform. Missing aggregate analytics that Google Forms provides automatically |

---

### Scenario 1.4: Accepting Job Applications for a New Hire

**Goal**: Sarah needs to collect applications with resume uploads, confirm email addresses, and route submissions to her inbox.

#### Step-by-Step Journey

| Step | User Action | Platform Response | Status |
|------|-------------|-------------------|--------|
| 1 | She creates a multi-step application form: personal info → role & experience | Two sections with appropriate fields | ✅ **Supported** |
| 2 | She needs an email confirmation field that matches the first email | She adds two email fields and uses an `expression` validator: `data.confirm_email === data.email` | ✅ **Supported** — Cross-field validation |
| 3 | She wants to verify the applicant's email with a code | She enables `otp: true` on the email field | ✅ **Supported** — Built-in OTP verification (unique feature!) |
| 4 | She adds a resume upload field (accept only PDF, max 1 file) | She adds `file_upload` with `max: 1` validator. But she cannot restrict to PDF only | ⚠️ **Partial** — File count works, but no file type restrictions |
| 5 | She adds a "Role" dropdown with an "Other" option | `single_select` with `allow_other: true` | ✅ **Supported** |
| 6 | She requires a cover letter of at least 50 characters | `long_text` with `min_length: 50` validator | ✅ **Supported** |
| 7 | She configures an email notification to hiring@company.com | Email connection with `include_responses: true` | ✅ **Supported** |
| 8 | She wants to add Turnstile CAPTCHA to prevent spam applications | She adds a `turnstile` field type | ✅ **Supported** |
| 9 | Applications come in. She wants to organize them by role in a spreadsheet | She would need to manually copy from JSON view | ❌ **Gap** — No export, no filtering by field value |
| 10 | She wants to close the form after selecting a candidate but keep the data | She would need to delete the form or manually manage | ⚠️ **Friction** — No form close/unpublish toggle (only start/end dates, which aren't in UI) |

#### Outcome Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Can she achieve her goal?** | ✅ Mostly yes | Strong on validation, OTP, and file upload. Weak on data management |
| **Standout strength** | Email OTP verification is a differentiator — most competitors charge extra for this |
| **Key gaps** | File type restrictions, data export, form close toggle |

---

## Persona 2: Developer / Technical Founder

**Profile**: Alex, 29, is a technical co-founder building a SaaS product. He wants to integrate forms into his application — onboarding flows, feedback collection, and support forms. He values API-first design, YAML-as-code, and the ability to version-control form definitions. He is comfortable with code and wants programmatic control.

**Key Expectations**:
- Create and manage forms via API or YAML
- Embed forms seamlessly in his product
- Receive submissions via webhooks for custom processing
- Version-control form definitions in Git
- Full control over form logic, validation, and flow
- Clean API documentation

---

### Scenario 2.1: Embedding a Form in a SaaS Product via API

**Goal**: Alex wants to embed a waitlist form in his product's landing page. He wants to create the form via YAML, deploy it from GitHub, and embed it seamlessly.

#### Step-by-Step Journey

| Step | User Action | Platform Response | Status |
|------|-------------|-------------------|--------|
| 1 | Alex creates a `waitlist.yaml` file in his GitHub repo | He defines the form schema in YAML with fields, validators, and connections | ✅ **Supported** — YAML-first is a unique competitive advantage |
| 2 | He pushes to his GitHub repo and accesses the form via slug | Form available at `/api/v1/forms/{owner}/{repo}/waitlist.yaml` | ✅ **Supported** — Git-native form deployment |
| 3 | He wants to embed the form on his landing page | He uses an iframe with `?embed=true` which removes padding and branding | ✅ **Supported** |
| 4 | He wants tighter integration — render the form as a React component in his app | He can install `@declarativeforms/core` as an npm package and use the `DeclarativeForm` component directly | ✅ **Supported** — Component-level embedding (unique advantage) |
| 5 | He wants to version-control the form alongside his codebase | YAML form files live in his repo, tracked by Git | ✅ **Supported** — This is unmatched by Tally/Jotform/Typeform |
| 6 | He wants to customize the form's appearance to match his app's design system | He can set the primary color. For deeper customization (fonts, spacing, layout), the options are limited | ⚠️ **Partial** — Primary color only. As a developer, he might want to override CSS or pass theme tokens |
| 7 | He wants to track the form_source via a hidden field from the page URL | He adds a `hidden` field and uses `?source=landing_page` query parameter | ✅ **Supported** |
| 8 | He sets up a webhook to receive submissions and process them in his backend | Webhook connection sends full JSON payload via POST | ✅ **Supported** |
| 9 | He wants the webhook to include a signing secret so he can verify authenticity | ❌ **Not possible** — webhooks are unsigned POST requests | ❌ **Gap** |
| 10 | He wants to send custom headers (API key) with the webhook | ❌ **Not possible** — no custom headers supported | ❌ **Gap** |
| 11 | He reads the API documentation | Swagger/OpenAPI docs available at `/docs` endpoint | ✅ **Supported** |
| 12 | He creates forms programmatically via the Studio API | `POST /api/v1/studio/forms` with full form JSON body | ✅ **Supported** |

#### Outcome Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Can he achieve his goal?** | ✅ Yes | Core workflow is excellent. YAML + Git + API + React component = strong developer story |
| **Standout strength** | YAML-as-code, Git-native deployment, and React component embedding are unique differentiators no competitor matches |
| **Key gaps** | Webhook signing/auth, deeper CSS/theme customization |
| **Competitive comparison** | Leading | No competitor offers YAML-first, Git-managed, component-embeddable forms |

---

### Scenario 2.2: Building a Multi-Step Onboarding Flow with Conditional Logic

**Goal**: Alex wants to build a 5-step employee onboarding form for his product. It should branch based on role (engineering gets different questions than sales), validate across fields, and auto-save progress.

#### Step-by-Step Journey

| Step | User Action | Platform Response | Status |
|------|-------------|-------------------|--------|
| 1 | He defines 5 sections in YAML: personal → role → engineering_details / sales_details → equipment → emergency | Multi-section form with conditional `next` routing | ✅ **Supported** |
| 2 | After the "role" section, he wants engineers to go to "engineering_details" and sales to go to "sales_details" | `next: [{when: "data.department === 'Engineering'", go: "engineering_details"}, {else: "sales_details"}]` | ✅ **Supported** — Powerful conditional routing |
| 3 | He wants fields to appear/hide based on selections within a section | `visible_when` expressions on individual fields | ✅ **Supported** |
| 4 | He needs cross-field validation (confirm email must match email) | `expression` validator: `"data.confirm_email === data.email"` | ✅ **Supported** |
| 5 | He wants the form to auto-save as users progress through sections | Partial submissions are automatically saved with each section completion | ✅ **Supported** — Each section submit sends `?partial=true` |
| 6 | If a user closes the browser and returns, he wants them to resume | Submission ID in URL parameter allows resuming | ✅ **Supported** — but requires the user to have the same URL with `?submission_id=` |
| 7 | He wants a progress indicator (Step 2 of 5) | ❌ **Not possible** — no progress bar or step counter component | ❌ **Gap** |
| 8 | He wants real-time validation as users type (not just on submit) | ❌ **Not possible** — validation only triggers on section submit | ❌ **Gap** |
| 9 | He wants to localize the form into English and Spanish | All text properties support `ILocalizedText` objects with `en`/`es` keys | ✅ **Supported** — Full i18n with runtime locale switching |
| 10 | He wants the locale to be auto-detected from the user's browser | He would need to pass `?lang=es` manually or set it in code | ⚠️ **Friction** — No automatic browser locale detection |
| 11 | He deploys the form from a GitHub repo and it auto-updates when he pushes changes | GitHub-sourced forms are fetched on-demand from the repo | ✅ **Supported** — Live updates from Git |

#### Outcome Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Can he achieve his goal?** | ✅ Yes | Multi-step, conditional routing, auto-save, and i18n all work well |
| **Standout strengths** | Expression-powered conditional logic is more powerful than visual builders. Auto-save with resume. Git-based deployment |
| **Key gaps** | Progress indicator, real-time validation, auto locale detection |
| **Competitive comparison** | Competitive-to-leading | Logic engine is superior to Tally/Typeform. Missing UX polish (progress bar) |

---

### Scenario 2.3: Integrating Form Submissions into an Automation Pipeline

**Goal**: Alex wants form submissions to trigger automated workflows — create a Jira ticket, send a Slack notification, and add a row to Google Sheets. He needs reliable, verifiable webhook delivery.

#### Step-by-Step Journey

| Step | User Action | Platform Response | Status |
|------|-------------|-------------------|--------|
| 1 | He configures a webhook pointing to his Zapier/n8n endpoint | Webhook connection with URL | ✅ **Supported** |
| 2 | He wants different webhooks for different form outcomes (e.g., critical bugs go to PagerDuty) | Conditional `when` expressions on webhook connections | ✅ **Supported** — Each webhook can have its own trigger condition |
| 3 | He wants to see a log of webhook deliveries and their status codes | ❌ **Not possible** — fire-and-forget, no delivery logging | ❌ **Gap** |
| 4 | A webhook fails (endpoint is temporarily down). He wants it retried | ❌ **Not possible** — no retry logic | ❌ **Gap** |
| 5 | He wants to verify that incoming webhooks are genuinely from Declarative Forms | ❌ **Not possible** — no HMAC signature or shared secret | ❌ **Gap** |
| 6 | He wants to also push data directly to Airtable | Airtable OAuth integration with base/table configuration | ✅ **Supported** |
| 7 | He wants to send a confirmation email to the submitter | Email connection with dynamic `to: "{{data.email}}"` | ✅ **Supported** |
| 8 | He wants the email to have a styled HTML template with his company branding | ⚠️ **Limited** — Email body is plain text with template variables. No rich HTML template editor | ⚠️ **Partial** |
| 9 | He wants to trigger connections only for completed submissions, not partials | Email and Airtable connections already only fire on completed submissions. Webhooks fire on all submissions. | ⚠️ **Partial** — Webhook behavior is different from email/Airtable |
| 10 | He wants to use the API to programmatically list submissions and build his own dashboard | `GET /api/v1/studio/forms/{id}/submissions` returns all submissions | ✅ **Supported** — but no pagination, filtering, or sorting |

#### Outcome Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Can he achieve his goal?** | ⚠️ Partially | Basic integrations work but lack production reliability features |
| **Key blockers** | Webhook reliability (no retries, no logging, no signing) is a concern for production use |
| **Competitive comparison** | Behind | Tally and Jotform offer webhook retry, delivery logs, and more native integrations |

---

## Persona 3: Operations / People Ops Manager

**Profile**: Maria, 41, manages operations for a 200-person company. She needs forms for employee onboarding, IT support requests, field data collection (warehouse inspections, delivery confirmations), and internal surveys. She works across desktop and mobile, needs data to flow into their systems, and cares about ease of use for her non-technical colleagues.

**Key Expectations**:
- Build forms quickly without developer help
- Collect data on mobile devices (photos, signatures, location)
- Route submissions to the right team based on form responses
- Export data for reporting
- Collaborate with team members on form building
- Restrict form access to internal users

---

### Scenario 3.1: Employee Onboarding Data Collection

**Goal**: Maria needs to collect personal details, equipment preferences, emergency contacts, and tax documents from new hires before their start date. The form should be multi-step and professional.

#### Step-by-Step Journey

| Step | User Action | Platform Response | Status |
|------|-------------|-------------------|--------|
| 1 | Maria logs into Studio with her email via Magic Link | Email-based auth works without needing GitHub | ✅ **Supported** |
| 2 | She wants to start from an "Employee Onboarding" template | ❌ Templates exist in the repo but are not available in the Studio UI. She must build from scratch | ❌ **Gap** |
| 3 | She creates 3 sections: Personal Details → Equipment → Emergency Contact | Multi-section form builder with section management | ✅ **Supported** |
| 4 | She adds an address field for home address | `address` field with Google Places autocomplete | ✅ **Supported** |
| 5 | She adds a date field for start date | `date` field type available | ✅ **Supported** |
| 6 | She adds a phone number field for emergency contact | `mobile_number` field type | ✅ **Supported** |
| 7 | She wants to collect a photo of the new hire's ID | `camera` field with rear-facing mode for document capture | ✅ **Supported** — unique feature |
| 8 | She wants to collect a signed consent form | `signature` field with canvas-based drawing | ✅ **Supported** — unique feature |
| 9 | She wants to upload a tax document (W-4, only PDF allowed) | `file_upload` is available but she cannot restrict to PDF only | ⚠️ **Partial** — No file type restriction |
| 10 | She sends the form link to the new hire | Share via public URL | ✅ **Supported** |
| 11 | The new hire fills out on their phone | Mobile-optimized responsive design with native date pickers, camera access, signature scaling | ✅ **Supported** |
| 12 | The new hire stops midway and continues later | Partial submission saved, can resume with submission_id URL | ✅ **Supported** |
| 13 | Maria wants to know when the onboarding form is completed | Email connection notification | ✅ **Supported** |
| 14 | She wants HR and IT both notified | She needs to create two separate email connections (one per recipient) | ⚠️ **Friction** — Works but not intuitive. A single `to` field with comma-separated addresses would be easier |
| 15 | She wants to export all onboarding data to a spreadsheet for the payroll team | ❌ **Not possible** — no export | ❌ **Gap** |
| 16 | She wants to restrict the form so only people with a company email can submit | ❌ **Not possible** — no access control or email domain restriction at the form level (only `block_free_email` on individual email fields) | ⚠️ **Partial** — `block_free_email` helps but isn't a form-level restriction |
| 17 | She wants to hand over form management to her HR colleague | ❌ **Not possible** — no collaboration or form sharing between users | ❌ **Gap** |

#### Outcome Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Can she achieve her goal?** | ⚠️ Partially | Form building is strong (address, camera, signature, mobile). Data management and collaboration are weak |
| **Standout strengths** | Camera capture, signature, address autocomplete, mobile optimization, and auto-save make this viable for data collection |
| **Key gaps** | Templates in UI, data export, collaboration, file type restrictions |
| **Competitive comparison** | Mixed | Field types are stronger than Google Forms (camera, signature, geo). Data management weaker than Jotform |

---

### Scenario 3.2: Internal Support Request / IT Ticket Form

**Goal**: Maria wants an internal IT support form where employees submit issues. Critical issues should trigger an immediate alert. All issues should be logged to a webhook/Zapier for ticket creation.

#### Step-by-Step Journey

| Step | User Action | Platform Response | Status |
|------|-------------|-------------------|--------|
| 1 | She creates a support form with fields: name, email, category (dropdown), priority (single_select), description, screenshot (file_upload) | All field types available | ✅ **Supported** |
| 2 | She makes the category dropdown searchable (IT has 15+ categories) | `searchable: true` on dropdown | ✅ **Supported** |
| 3 | She wants critical priority issues to show an additional "Impact" field | `visible_when: "data.priority === 'critical'"` on the impact field | ✅ **Supported** |
| 4 | She configures a webhook to Zapier for all submissions (creates Jira tickets) | Webhook connection | ✅ **Supported** |
| 5 | She adds a conditional webhook for critical issues that pings Slack | Second webhook with `when: "data.priority === 'critical'"` | ✅ **Supported** |
| 6 | She adds Turnstile to prevent external spam if the form URL leaks | `turnstile` field type | ✅ **Supported** |
| 7 | She wants to password-protect the form so only employees can access it | ❌ **Not possible** — no password protection | ❌ **Gap** |
| 8 | She wants an auto-response email to the submitter confirming receipt | Email connection with `to: "{{data.email}}"` and confirmation message | ✅ **Supported** |
| 9 | She wants to track how many support requests come in per week | ❌ **Not possible** — no analytics or time-based reporting | ❌ **Gap** |
| 10 | She wants to see a bar chart of issues by category | ❌ **Not possible** — no aggregate visualizations | ❌ **Gap** |
| 11 | She wants to filter submissions by status or category | ❌ **Not possible** — results show all submissions in a flat list with no filtering | ❌ **Gap** |
| 12 | She wants employees to attach up to 3 screenshots | `file_upload` with `max: 3` validator | ✅ **Supported** |

#### Outcome Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Can she achieve her goal?** | ⚠️ Partially | Form creation and webhook routing are strong. Access control and analytics are missing |
| **Key gaps** | Password protection, submission analytics, filtering |
| **Competitive comparison** | Behind | Jotform and Google Forms both offer response filtering. Jotform has form encryption |

---

### Scenario 3.3: Collecting Field Data with Signatures and Photos

**Goal**: Maria needs a form for warehouse inspectors to submit inspection reports from the field. They need to take photos, capture GPS location, and sign off on the report — all from a mobile device.

#### Step-by-Step Journey

| Step | User Action | Platform Response | Status |
|------|-------------|-------------------|--------|
| 1 | She creates an "Inspection Report" form | New form created | ✅ **Supported** |
| 2 | She adds fields: inspector name, date, location (geolocation), inspection area (dropdown) | All field types available | ✅ **Supported** |
| 3 | She adds a `geolocation` field to capture the inspector's GPS position | Geolocation field uses browser API, shows accuracy indicator, displays map preview | ✅ **Supported** — excellent for field data |
| 4 | She adds a `camera` field for taking photos of the inspection area | Camera field with rear-facing mode for environment photos | ✅ **Supported** |
| 5 | She wants the inspector to take multiple photos | She would need multiple camera fields or a file_upload field. Camera field captures one photo | ⚠️ **Friction** — Camera captures one photo per field. She'd need to use file_upload for multiple photos (which loses the live camera UX on mobile) |
| 6 | She adds condition-related fields (pass/fail, notes) | Conditional visibility works: if `data.inspection_result === 'fail'`, show a required "corrective_action" field | ✅ **Supported** |
| 7 | She adds a `signature` field for the inspector to sign off | Canvas-based signature with clear/redo and high-DPI support | ✅ **Supported** |
| 8 | Inspector fills out the form on their phone in the warehouse | Mobile-optimized: native camera access, GPS, touch-friendly signature pad, responsive layout | ✅ **Supported** — this is a strong mobile experience |
| 9 | The form auto-saves as the inspector progresses through sections | Partial submissions saved automatically | ✅ **Supported** |
| 10 | Maria wants all inspection data in a spreadsheet for compliance reporting | ❌ **Not possible** — no export. She would need to build a custom solution using the API | ❌ **Gap** |
| 11 | She wants inspections to flow into Airtable automatically | Airtable connection available | ✅ **Supported** |
| 12 | She wants to see all inspections on a map | ❌ **Not possible** — no map view of submissions | ❌ **Gap** |
| 13 | She wants offline form filling (warehouse may have poor connectivity) | ❌ **Not possible** — forms require internet connection | ❌ **Gap** |

#### Outcome Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Can she achieve her goal?** | ✅ Mostly yes | The mobile data capture story (camera, GPS, signature, auto-save) is genuinely strong |
| **Standout strength** | This is a competitive differentiator — the combination of camera + geolocation + signature + auto-save on mobile is rare in form platforms |
| **Key gaps** | Multi-photo camera, data export, offline mode |
| **Competitive comparison** | Competitive | Stronger than Tally/Google Forms for field data. Behind Jotform's mobile app |

---

## Cross-Persona Summary

### Feature Support Matrix by Persona

| Feature | Sarah (SMB) | Alex (Developer) | Maria (Ops) |
|---------|-------------|-------------------|-------------|
| Form creation | ⚠️ No templates | ✅ YAML + API | ⚠️ No templates |
| Form building | ✅ Visual editor | ✅ YAML + Studio | ✅ Visual editor |
| Field variety | ✅ All needed | ✅ All needed | ✅ Camera, signature, geo |
| Conditional logic | ✅ Branching works | ✅ Full expressions | ✅ Visibility + routing |
| Multi-step | ✅ Sections work | ✅ With auto-save | ✅ With auto-save |
| Branding | ❌ Limited | ⚠️ Primary color only | ❌ Limited |
| Embedding | ⚠️ No embed snippet | ✅ React component | N/A |
| Email notifications | ✅ Works | ✅ Works | ⚠️ No multi-recipient |
| Webhooks | N/A | ⚠️ No signing/retries | ✅ Conditional routing |
| Data viewing | ❌ Raw JSON only | ✅ API access | ❌ No filtering |
| Data export | ❌ Not available | ⚠️ API only | ❌ Not available |
| Analytics | ❌ Not available | ❌ Not available | ❌ Not available |
| Collaboration | N/A | N/A | ❌ Not available |
| Access control | N/A | N/A | ❌ Not available |
| Mobile experience | ✅ Responsive | ✅ Responsive | ✅ Excellent |

### Where We Win (Competitive Advantages)

1. **YAML-as-Code + Git-Native** — No competitor offers version-controlled, Git-deployed form definitions. This is our strongest differentiator for developers.

2. **Expression-Powered Logic** — Full JavaScript expressions for visibility, routing, validation, and connection triggers exceed the visual rule builders of every competitor.

3. **Mobile Data Capture Suite** — Camera, geolocation with map, signature pad, and file upload with progress tracking is a rare combination that serves field operations use cases better than most competitors.

4. **Email OTP Verification** — Built-in email verification at the field level is typically a paid add-on or unavailable in Tally, Google Forms, and Typeform.

5. **React Component Embedding** — Developers can embed forms as native React components in their applications, not just iframes.

6. **API-First Architecture** — Clean REST API with Swagger docs enables programmatic form management that most competitors lock behind enterprise plans.

7. **Partial Auto-Save with Resume** — Automatic progress saving across sections with URL-based resume capability ensures no data loss in long forms.

### Where We Lose (Competitive Weaknesses)

1. **No Data Export** — Every competitor offers CSV export. This is table stakes.

2. **No Analytics** — Google Forms auto-generates response charts. We show raw JSON.

3. **No Templates in Studio** — We have 10 great templates but they're YAML files, not accessible from the UI.

4. **Limited Branding** — Primary color only. No logo, fonts, backgrounds, or "Powered by" removal.

5. **No Collaboration** — Single-user only. No teams, sharing, or permissions.

6. **Webhook Reliability** — No retries, logging, or signing makes webhooks risky for production.

7. **Results UX** — Raw JSON view, no filtering, no search, no submission count.

8. **No Form Scheduling in UI** — Start/end date fields exist in schema but are disabled in Studio.
