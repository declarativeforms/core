# Persona & Use-Case Gaps Analysis

> **Date**: April 11, 2026
> **Purpose**: Consolidated list of gaps identified through persona journey analysis, organized by persona and use case, with priority ratings and competitive context to guide our product roadmap.

---

## How to Read This Document

- **Gap ID**: Unique identifier for tracking (P = Persona, S = Scenario, G = Gap number)
- **Severity**: 🔴 Critical (blocks the use case), 🟡 Important (degrades the experience), 🟢 Nice-to-have (polish/enhancement)
- **Frequency**: How many personas/scenarios encountered this gap (higher = more urgent)
- **Competitor Benchmark**: Which competitors already solve this

---

## Gap Frequency Summary

| Gap | Occurrences | Severity |
|-----|-------------|----------|
| No CSV/Excel data export | 6 of 10 scenarios | 🔴 Critical |
| No response analytics / charts | 5 of 10 scenarios | 🔴 Critical |
| No form templates in Studio UI | 4 of 10 scenarios | 🔴 Critical |
| Raw JSON results view (not user-friendly) | 4 of 10 scenarios | 🔴 Critical |
| No progress indicator for multi-step forms | 3 of 10 scenarios | 🟡 Important |
| No team collaboration / form sharing | 3 of 10 scenarios | 🟡 Important |
| Limited branding (no logo, fonts, backgrounds) | 3 of 10 scenarios | 🟡 Important |
| Webhook reliability (no retries, logging, signing) | 3 of 10 scenarios | 🟡 Important |
| No form access control / password protection | 2 of 10 scenarios | 🟡 Important |
| Start/end date UI disabled in Studio | 2 of 10 scenarios | 🟡 Important |
| No file type restrictions on upload | 2 of 10 scenarios | 🟡 Important |
| No submission count cap | 1 of 10 scenarios | 🟢 Nice-to-have |
| No submission filtering / search | 2 of 10 scenarios | 🟡 Important |
| No embed code snippet in UI | 1 of 10 scenarios | 🟢 Nice-to-have |
| Single email recipient per connection | 2 of 10 scenarios | 🟢 Nice-to-have |
| No real-time validation (on blur) | 2 of 10 scenarios | 🟡 Important |
| No offline form support | 1 of 10 scenarios | 🟢 Nice-to-have |
| No multi-photo camera field | 1 of 10 scenarios | 🟢 Nice-to-have |

---

## Persona 1: Small Business Owner (Sarah)

### Scenario 1.1 — Contact Form on Website

| Gap ID | Gap Description | Severity | Impact on User | Competitor Benchmark |
|--------|-----------------|----------|----------------|---------------------|
| P1-S1-G1 | **No logo upload or custom branding** — Sarah cannot add her agency logo or customize fonts to match her brand identity | 🟡 Important | Form looks generic, not professional for her agency brand | Tally: Logo + cover image. Jotform: Full CSS. Typeform: Fonts, colors, images |
| P1-S1-G2 | **No embed code snippet** — Sarah must manually construct iframe HTML with `?embed=true` parameter instead of copying a ready-made snippet | 🟢 Nice-to-have | Confusing for non-technical users who can't write HTML | Tally: Copy-paste embed. Jotform: Embed wizard. Google Forms: One-click embed |
| P1-S1-G3 | **Results shown as raw JSON** — Submission data displayed as unformatted JSON, not a readable table | 🔴 Critical | Non-technical Sarah cannot read JSON. She expected a clean table layout | Google Forms: Auto table + charts. Tally: Clean table view. Jotform: Grid/table view |
| P1-S1-G4 | **No CSV/Excel export** — Sarah cannot download responses as a spreadsheet | 🔴 Critical | She cannot share data with her team or do analysis in Excel/Sheets | All competitors: CSV export is universal table stakes |
| P1-S1-G5 | **No form view/submission analytics** — No view count, submission count, or conversion rate | 🟡 Important | She can't measure form effectiveness or know if people are abandoning | Google Forms: Response summary. Tally: View/submission counts |

### Scenario 1.2 — Event Registration with Deadline

| Gap ID | Gap Description | Severity | Impact on User | Competitor Benchmark |
|--------|-----------------|----------|----------------|---------------------|
| P1-S2-G1 | **Start/end date fields disabled in Studio UI** — Form scheduling is supported in the schema but the UI controls are commented out. Sarah cannot set availability dates without editing YAML | 🟡 Important | She cannot set registration deadlines through the visual builder | Tally: Date scheduling. Jotform: Open/close dates. Google Forms: Accept responses toggle |
| P1-S2-G2 | **No submission count cap** — Cannot close form after N responses | 🟢 Nice-to-have | She risks over-registration for her workshop | Google Forms: Response limit add-on. Jotform: Submission limits |
| P1-S2-G3 | **No response count on dashboard** — Cannot see at a glance how many registrations she has | 🔴 Critical | She has to open each form and count submissions manually | Tally: Count on dashboard. Jotform: Count in list. Google Forms: Count in list |
| P1-S2-G4 | **No CSV export for event planning** — Cannot export attendee list to spreadsheet | 🔴 Critical | Cannot share registration list with event team | All competitors offer this |

### Scenario 1.3 — Customer Feedback Survey

| Gap ID | Gap Description | Severity | Impact on User | Competitor Benchmark |
|--------|-----------------|----------|----------------|---------------------|
| P1-S3-G1 | **No aggregate analytics** — Cannot see average satisfaction rating or distribution chart | 🟡 Important | She has no quick insight into overall customer sentiment | Google Forms: Auto pie/bar charts. Typeform: Response analytics |
| P1-S3-G2 | **No progress indicator** — Multi-step form shows no visual indication of progress | 🟡 Important | Respondents don't know how many questions remain, which can increase abandonment | Typeform: Progress bar. Tally: Step indicator. Jotform: Progress bar |

### Scenario 1.4 — Job Applications

| Gap ID | Gap Description | Severity | Impact on User | Competitor Benchmark |
|--------|-----------------|----------|----------------|---------------------|
| P1-S4-G1 | **No file type restrictions** — Cannot limit resume uploads to PDF only | 🟡 Important | Applicants may upload incompatible file types (e.g., .pages, .numbers) | Google Forms: File type filter. Jotform: MIME type restrictions |
| P1-S4-G2 | **No form close/unpublish toggle** — Cannot close applications when position is filled without deleting the form | 🟡 Important | Applications continue coming in after position is filled | Tally: Open/close toggle. Google Forms: Accept responses toggle |

---

## Persona 2: Developer (Alex)

### Scenario 2.1 — Embed Form in SaaS Product

| Gap ID | Gap Description | Severity | Impact on User | Competitor Benchmark |
|--------|-----------------|----------|----------------|---------------------|
| P2-S1-G1 | **No webhook signing / HMAC verification** — Webhooks are unsigned POST requests. Alex cannot verify that payloads genuinely come from Declarative Forms | 🟡 Important | Security concern for production systems processing form data | Stripe: Webhook signatures. Tally: Signing secret. Typeform: HMAC signing |
| P2-S1-G2 | **No custom webhook headers** — Cannot send API keys, auth tokens, or custom headers with webhook requests | 🟡 Important | Cannot authenticate webhooks to protected endpoints | Jotform: Custom headers. Zapier: Auth options |
| P2-S1-G3 | **Limited theme customization** — Only primary color. No CSS overrides, font tokens, or design system integration for embedded forms | 🟡 Important | Embedded form looks slightly different from host app's design system | Typeform: Theme API. Jotform: Custom CSS injection |

### Scenario 2.2 — Multi-Step Onboarding with Logic

| Gap ID | Gap Description | Severity | Impact on User | Competitor Benchmark |
|--------|-----------------|----------|----------------|---------------------|
| P2-S2-G1 | **No progress indicator component** — Multi-step forms have no visual step counter or progress bar | 🟡 Important | Users of his product don't know how far along they are in onboarding | Typeform: Progress bar. All competitors support this |
| P2-S2-G2 | **No real-time validation (on blur/change)** — Validation only triggers on section submit | 🟡 Important | Users must submit before seeing errors, creating a frustrating loop | Google Forms: Real-time. Typeform: On blur. Jotform: Configurable |
| P2-S2-G3 | **No automatic browser locale detection** — Must pass `?lang=` parameter manually | 🟢 Nice-to-have | Extra implementation work for developers | Typeform: Auto-detects locale |

### Scenario 2.3 — Automation Pipeline Integration

| Gap ID | Gap Description | Severity | Impact on User | Competitor Benchmark |
|--------|-----------------|----------|----------------|---------------------|
| P2-S3-G1 | **No webhook delivery logging** — Cannot see if webhooks succeeded or failed | 🔴 Critical | Data can be silently lost with no visibility into delivery status | Tally: Delivery logs. Stripe: Event dashboard |
| P2-S3-G2 | **No webhook retry logic** — Failed webhooks are not retried. Single fire-and-forget attempt | 🔴 Critical | Temporary endpoint downtime causes permanent data loss | Tally: Automatic retries. Stripe: Exponential backoff. Jotform: Retry mechanism |
| P2-S3-G3 | **No webhook signing** — Same as P2-S1-G1. Payloads cannot be verified for authenticity | 🟡 Important | Security risk in production webhook consumers | Standard practice for all webhook providers |
| P2-S3-G4 | **No API pagination on submission listing** — `GET /studio/forms/:id/submissions` returns all submissions with no pagination | 🟡 Important | Performance degrades as submissions grow. No way to page through large datasets | Standard REST API practice |
| P2-S3-G5 | **Webhook fires on both partial and completed submissions** — No way to filter webhook triggers by submission status | 🟢 Nice-to-have | Developer must filter in their webhook consumer, adding unnecessary complexity | Jotform: Event type filtering |
| P2-S3-G6 | **Email templates are plain text only** — No rich HTML email template editor or preview | 🟢 Nice-to-have | Confirmation emails look unprofessional compared to competitors | Mailchimp integration (Jotform). Rich editor (Tally) |

---

## Persona 3: Operations / People Ops Manager (Maria)

### Scenario 3.1 — Employee Onboarding

| Gap ID | Gap Description | Severity | Impact on User | Competitor Benchmark |
|--------|-----------------|----------|----------------|---------------------|
| P3-S1-G1 | **No form templates in Studio** — 10 templates exist as YAML files but aren't accessible from the Studio "New Form" flow | 🔴 Critical | Maria must build a complex 3-section onboarding form from scratch instead of starting from a template | Tally: Template gallery. Jotform: 10,000+ templates. Google Forms: Template gallery |
| P3-S1-G2 | **No file type restriction on uploads** — Cannot limit document uploads to PDF | 🟡 Important | New hires may upload incompatible file formats | Google Forms: File type filter |
| P3-S1-G3 | **No CSV export** — Cannot export onboarding data for payroll/HR systems | 🔴 Critical | Manual data re-entry from JSON view | All competitors offer CSV export |
| P3-S1-G4 | **No team collaboration** — Maria cannot share form editing access with her HR colleague | 🟡 Important | Single point of failure; bottleneck if Maria is unavailable | Google Forms: Shared editing. Tally Teams: Collaboration. Jotform: Team accounts |
| P3-S1-G5 | **Single email recipient per connection** — Must create duplicate connections to notify multiple people | 🟢 Nice-to-have | Tedious setup when multiple stakeholders need notifications | All competitors: Multiple recipients, CC/BCC |
| P3-S1-G6 | **No form-level access control** — Cannot restrict form to company email domain only | 🟡 Important | External people could submit if they get the URL. `block_free_email` helps but doesn't restrict to a specific domain | Google Forms: Org-restricted. Jotform: Password protection |

### Scenario 3.2 — IT Support Request Form

| Gap ID | Gap Description | Severity | Impact on User | Competitor Benchmark |
|--------|-----------------|----------|----------------|---------------------|
| P3-S2-G1 | **No form password protection** — Cannot restrict the support form to internal employees | 🟡 Important | If the form URL leaks externally, anyone can submit fake tickets | Jotform: Password/encryption. Tally: Password protection |
| P3-S2-G2 | **No submission analytics** — Cannot track support request volume, trends, or category distribution | 🔴 Critical | Maria cannot report on IT support metrics without manual counting | Google Forms: Summary charts. Jotform: Analytics dashboard |
| P3-S2-G3 | **No submission filtering or search** — Cannot find specific submissions or filter by category/priority | 🟡 Important | As submissions grow, finding a specific request becomes impossible | Jotform: Search + filter. Google Forms: Spreadsheet integration |
| P3-S2-G4 | **No data export** — Cannot generate weekly/monthly support reports | 🔴 Critical | Manual process to compile support metrics | All competitors offer export |

### Scenario 3.3 — Field Inspection with Photos/Signatures

| Gap ID | Gap Description | Severity | Impact on User | Competitor Benchmark |
|--------|-----------------|----------|----------------|---------------------|
| P3-S3-G1 | **Camera field captures only one photo** — No multi-capture mode for taking several photos in sequence | 🟢 Nice-to-have | Inspectors need multiple photos; must use separate camera fields or switch to file_upload (losing live camera UX) | Jotform: Multi-photo. Custom apps: Gallery capture |
| P3-S3-G2 | **No data export for compliance reporting** — Cannot export inspection data | 🔴 Critical | Compliance reports cannot be generated without manual effort | All competitors offer export |
| P3-S3-G3 | **No offline form support** — Forms require internet to load and submit | 🟢 Nice-to-have | Warehouses/remote sites may have poor connectivity. Inspectors cannot fill forms offline | Jotform: Offline mobile app. Google Forms: Offline Chrome |
| P3-S3-G4 | **No map view of submissions** — Cannot visualize inspection locations on a map | 🟢 Nice-to-have | Would be valuable for geographic analysis of inspections | Specialized tools only |

---

## Consolidated Priority Matrix

### 🔴 Tier 1 — Critical Gaps (Block core use cases, all competitors have these)

These gaps prevent users from completing fundamental workflows and are universally available in competing products.

| # | Gap | Affected Personas | Affected Scenarios | Recommended Action |
|---|-----|-------------------|-------------------|-------------------|
| 1 | **CSV/Excel data export** | All 3 | 6 of 10 | Add "Export CSV" button to Results tab. Include all fields as columns, submissions as rows |
| 2 | **Readable results table** (not raw JSON) | Sarah, Maria | 4 of 10 | Replace JSON view with a structured table layout. Show field labels as headers, values in cells |
| 3 | **Response analytics summary** | All 3 | 5 of 10 | Add submission count to dashboard. Add basic summary charts (rating distributions, select field breakdowns) |
| 4 | **Form templates in Studio** | Sarah, Maria | 4 of 10 | Surface the 10 existing templates in the "New Form" flow as selectable options |
| 5 | **Webhook retry & delivery logging** | Alex | 3 of 10 | Implement exponential backoff (3 retries), store delivery status, show in Studio |

### 🟡 Tier 2 — Important Gaps (Degrade the experience significantly)

These don't block the use case but cause meaningful friction, reduce professionalism, or create workaround-heavy workflows.

| # | Gap | Affected Personas | Recommended Action |
|---|-----|-------------------|-------------------|
| 6 | **Progress indicator for multi-step forms** | Sarah, Alex | Add optional progress bar / step counter component |
| 7 | **Enable start/end date UI in Studio** | Sarah, Maria | Uncomment the date fields in form settings |
| 8 | **Branding: logo, fonts, backgrounds** | Sarah, Maria | Add logo upload, font selector, background color to theme |
| 9 | **Team collaboration / form sharing** | Maria | Add collaborator invites with role-based permissions |
| 10 | **Webhook HMAC signing** | Alex | Add signing secret per webhook, include signature header |
| 11 | **Real-time validation (on blur)** | Alex, Sarah | Add `mode: "onBlur"` option to React Hook Form configuration |
| 12 | **File type restrictions on upload** | Sarah, Maria | Add `accept` / `allowed_types` property to file_upload field |
| 13 | **Submission filtering & search** | Maria | Add search bar and field-value filters to Results tab |
| 14 | **Form access control (password, domain restriction)** | Maria | Add password protection and/or email domain restriction |
| 15 | **Form close / unpublish toggle** | Sarah | Add open/closed status toggle in Settings |
| 16 | **Submission count on dashboard** | Sarah, Maria | Show response count badge next to each form in the list |
| 17 | **API pagination for submissions** | Alex | Add `page` and `per_page` query params to list endpoints |

### 🟢 Tier 3 — Nice-to-Have Gaps (Polish, differentiation, edge cases)

These are enhancements that would improve specific scenarios but don't block or significantly degrade core workflows.

| # | Gap | Affected Personas | Recommended Action |
|---|-----|-------------------|-------------------|
| 18 | **Embed code snippet in sharing UI** | Sarah | Generate iframe HTML and provide copy button in Share tab |
| 19 | **Multiple email recipients** | Maria | Support comma-separated addresses or array in `to` field |
| 20 | **Auto browser locale detection** | Alex | Detect `navigator.language` and use as default form locale |
| 21 | **Webhook custom headers** | Alex | Add optional headers map to webhook connection config |
| 22 | **Multi-photo camera field** | Maria | Allow camera field to capture multiple photos in sequence |
| 23 | **Webhook status filtering** | Alex | Add option to only fire on `completed` (not `partial`) submissions |
| 24 | **Rich HTML email templates** | Alex | Add HTML email template editor or prebuilt templates |
| 25 | **Offline form support** | Maria | PWA / service worker for offline filling with sync on reconnect |
| 26 | **Map view of geolocated submissions** | Maria | Aggregate map visualization in Results tab |
| 27 | **Submission count cap** | Sarah | Add max_submissions property and enforce server-side |
| 28 | **Form duplication** | All 3 | Add "Duplicate" action to form context menu |

---

## Gap-to-Feature Mapping (What to Build)

### Quick Wins (Low effort, high impact)

These can likely be implemented in days, not weeks:

1. **Enable start/end date UI** — Uncomment existing code in Studio form settings
2. **Submission count on dashboard** — Add `.length` display from existing submissions query
3. **Embed code snippet** — Generate `<iframe>` HTML string from existing share URL
4. **Multiple email recipients** — Parse comma-separated `to` field into array
5. **Form duplication** — Copy existing form JSON and POST to create endpoint
6. **File type restrictions** — Add `accept` property to file_upload schema and HTML input

### Medium Effort (Weeks of work)

7. **CSV export** — Map form schema fields to columns, submissions to rows, generate CSV
8. **Results table view** — Replace JSON viewer with structured table using field labels
9. **Templates in Studio** — Load templates from `/templates/` and present in "New Form" dialog
10. **Progress indicator** — Add step counter component to form section renderer
11. **Real-time validation** — Set React Hook Form `mode: "onBlur"` + per-field validation triggers
12. **Submission filtering** — Add search input and field-value filters to Results panel

### Larger Investments (Sprints of work)

13. **Response analytics** — Charts for rating distribution, select field breakdowns, time-series
14. **Webhook reliability** — Retry queue, exponential backoff, delivery status storage, UI
15. **Team collaboration** — Multi-user access, roles, permissions, shared workspaces
16. **Branding suite** — Logo upload, font selection, background customization, "Powered by" removal
17. **Form access control** — Password protection, email domain restrictions, open/close toggle
18. **Webhook signing** — HMAC-SHA256 signing with per-connection secrets, signature header
19. **API pagination** — Cursor or offset-based pagination on list endpoints

---

## Competitive Positioning Summary

### Our Unique Advantages (Defend and Market These)

| Advantage | Why It Matters | Which Persona Values It Most |
|-----------|---------------|------------------------------|
| YAML-as-Code + Git deployment | Version-controlled forms, CI/CD integration | Developer (Alex) |
| Full JavaScript expression engine | More powerful than any visual rule builder | Developer (Alex) |
| React component embedding | Native embedding, not just iframes | Developer (Alex) |
| Camera + Geolocation + Signature | Field data collection on mobile | Operations (Maria) |
| Email OTP verification | Built-in identity verification | All personas |
| Partial auto-save with resume | No data loss on long forms | Operations (Maria) |
| API-first with Swagger docs | Programmatic form management | Developer (Alex) |
| Conditional everything | Visibility, routing, completion, connections | All personas |

### Where Competitors Beat Us (Close These Gaps)

| Competitor | What They Do Better | Our Priority Response |
|------------|--------------------|-----------------------|
| **Google Forms** | Response charts, CSV export, collaboration, free | Tier 1: Export + analytics. Tier 2: Collaboration |
| **Tally** | Templates, branding, progress bar, webhook reliability | Tier 1: Templates. Tier 2: Branding, progress bar |
| **Jotform** | 10K+ templates, payment integration, mobile app, file restrictions | Tier 1: Templates. Tier 2: File restrictions |
| **Typeform** | Beautiful design, progress bar, real-time validation | Tier 2: Progress indicator, real-time validation, themes |

### Recommended Roadmap Priority

**Phase 1 (Next 2-4 weeks)**: Close critical table-stakes gaps
- CSV export, results table view, templates in Studio, enable start/end dates

**Phase 2 (Next 1-2 months)**: Improve core experience
- Progress indicator, real-time validation, submission filtering, response counts, branding basics

**Phase 3 (Next quarter)**: Platform maturity
- Webhook reliability, team collaboration, access control, analytics dashboard, API pagination
