# Studio — Step-by-Step Build Prompts

Execute these prompts sequentially. Each one builds on top of the previous.

---

## Prompt 1: Scaffold the Studio Package

```
Create a new package at `packages/studio` for the Declarative Forms Studio app — a form builder UI.

Mirror the exact tooling and configuration from `packages/core`:

1. **package.json** — Name it `@declarativeforms/studio`. Copy the same structure as `packages/core/package.json` but with these dependencies only (no CodeMirror, leaflet, react-leaflet, mixpanel, handlebars, or map-related types):
   - React 19, React DOM, React Router DOM 7
   - @tanstack/react-query
   - Tailwind CSS 4 + @tailwindcss/vite
   - Radix UI (checkbox, collapsible, dialog, label, radio-group, select, slot, tabs)
   - class-variance-authority, clsx, tailwind-merge
   - lucide-react, framer-motion
   - react-hook-form, @hookform/resolvers, zod
   - js-yaml (for YAML generation/parsing)
   - @declarativeforms/types, @declarativeforms/common, @declarativeforms/runtime
   - DevDeps: vite, @vitejs/plugin-react, typescript, eslint + plugins, tw-animate-css, @types/node, @types/react, @types/react-dom, @types/js-yaml

2. **vite.config.ts** — Identical to `packages/core/vite.config.ts` (React plugin, Tailwind plugin, `@` path alias).

3. **tsconfig.json**, **tsconfig.app.json**, **tsconfig.node.json** — Copy from core. The tsconfig.json should reference `../types`, `../common`, `../runtime`, and the app/node configs. tsconfig.app.json should have the `@/*` path alias pointing to `./src/*`.

4. **eslint.config.js** — Identical to core.

5. **components.json** — Identical to `packages/core/components.json` (shadcn new-york style, lucide icons, same aliases).

6. **index.html** — Similar to core but titled "Studio — Declarative Forms". Include the Inter font from Google Fonts. No Google Maps script needed.

7. **src/index.css** — Copy the entire file from `packages/core/src/index.css` (all Tailwind imports, theme variables with oklch colors, dark mode, base layer styles, reduced-motion media query).

8. **src/lib/utils.ts** — Copy the `cn()` utility from `packages/core/src/lib/utils.ts`.

9. **src/main.tsx** — Bootstrap with React 19's createRoot, BrowserRouter, QueryClientProvider. No I18nProvider needed for now.

10. **src/App.tsx** — Simple Routes setup with a single `<Route path="/" element={<DashboardPage />} />` and a catch-all 404 for now.

11. **src/pages/dashboard.page.tsx** — Minimal placeholder that renders "Dashboard" in an h1.

12. **src/pages/index.ts** — Barrel export for the dashboard page.

13. Update the **root package.json** — Add `"dev:studio"` and `"build:studio"` scripts targeting the studio workspace.

14. Update the **root tsconfig.json** — Add `{ "path": "packages/studio" }` to the references array.

15. Run `npx shadcn@latest add button card input label tabs dialog select checkbox textarea` inside `packages/studio` to install the base shadcn/ui components. Make sure these are generated in `src/components/ui/`.

After this step, `npm run dev:studio` should start a working Vite dev server showing "Dashboard".
```

---

## Prompt 2: Pages and React Router

```
Set up all the pages and routing for the Studio app in `packages/studio`.

Reference `packages/core/src/App.tsx` and `packages/core/src/pages/index.ts` for the coding style and patterns.

Create these pages as minimal placeholders (each with a descriptive h1 and useEffect to set document.title):

1. **src/pages/dashboard.page.tsx** — Already exists, update it to set `document.title = "Dashboard — Studio"`.

2. **src/pages/form-editor.page.tsx** — Placeholder for the form editor. This page will receive a form ID via route params (`useParams`). Set title to "Edit Form — Studio".

3. **src/pages/not-found.page.tsx** — Simple 404 page with a link back to dashboard.

4. **src/pages/index.ts** — Barrel export all pages.

Update **src/App.tsx** with these routes:
- `/` → DashboardPage
- `/forms/:formId` → FormEditorPage
- `*` → NotFoundPage

Make sure all pages follow the same pattern as the core project — named exports, functional components, consistent file naming with `.page.tsx` suffix.
```

---

## Prompt 3: App Layout Shell

```
Create a persistent app layout shell for the Studio app in `packages/studio`.

This layout wraps all pages and provides:

1. **src/components/app-layout.tsx** — A layout component with:
   - A top navigation bar (h-14) with:
     - Left: App name "Studio" as a link to `/` (text-sm font-semibold)
     - Right: A placeholder avatar/icon button (for future auth)
   - Below the nav: renders `{children}` taking up the remaining viewport height
   - Use the same Tailwind patterns as core (bg-background, border-border, text-foreground, etc.)

2. Wrap all routes in App.tsx with this layout so every page gets the nav bar.

3. Use lucide-react icons where appropriate (e.g., `LayoutDashboard` for the logo area, `User` for the avatar placeholder).

Keep it minimal and clean — matching the visual style of the core project's playground page header.
```

---

## Prompt 4: Dashboard Page — Forms Grid

```
Build the Dashboard page in `packages/studio/src/pages/dashboard.page.tsx`.

This is the landing page where users see all their forms in a tile/card grid layout.


**Dashboard layout**:
1. Page header area with:
   - Title: "Forms" (text-2xl font-semibold)
   - "New Form" button (primary variant) with a Plus icon from lucide-react, positioned to the right of the title
   - Clicking "New Form" should navigate to `/forms/new` using React Router's `useNavigate`

2. Grid of form cards below the header:
   - Responsive grid: 1 column on mobile, 2 on md, 3 on lg
   - Each card shows:
     - Form title (font-medium)
     - Description truncated to 2 lines (text-sm text-muted-foreground)
     - Bottom row: status badge (Draft/Published with appropriate colors) and response count (e.g., "12 responses")
     - Updated date in relative format (e.g., "2 days ago") — write a simple `timeAgo()` helper in `src/lib/utils.ts`
   - Clicking a card navigates to `/forms/{id}`
   - Cards should have hover:shadow-md transition

3. Empty state: If no forms exist, show a centered message with an illustration placeholder and the "New Form" button.

Use shadcn Card and Button components. Follow the same styling patterns as the core project (oklch colors, neutral palette, clean spacing).
```

---

## Prompt 5: Form Editor — Layout with Tabs

```
Build the Form Editor page layout in `packages/studio/src/pages/form-editor.page.tsx`.

This is the page users see when they click on a form from the dashboard or create a new form.

Reference `packages/core/src/pages/playground.page.tsx` for layout patterns (split panes, tabs).

**Layout structure**:
1. A top bar (h-12, border-b) with:
   - Left: Back arrow button (link to `/`) and the form title (editable inline — just a text input styled to look like a heading)
   - Right: "Save" button (primary), status indicator (Draft/Published)

2. Below the top bar, a tab bar using shadcn Tabs component with 4 tabs:
   - **Edit** — The form builder (default active tab)
   - **Preview** — Live form preview
   - **Share** — Sharing options
   - **Results** — Submission results

3. Each tab content area takes up the remaining viewport height (flex-1 min-h-0 overflow-y-auto).

**For now, each tab should render a placeholder**:
- Edit tab: "Form builder goes here"
- Preview tab: "Form preview goes here"
- Share tab: "Share options go here"
- Results tab: "Results table goes here"

**Form state**: Create a React context or use useState at the page level to manage the form being edited. For now, load mock data based on the `formId` param from the URL. If `formId` is "new", start with a blank form template (use the `defaultYaml` structure from `packages/core/src/components/yaml-editor.tsx` as a reference for what a default form looks like, but store it as a JS object matching `IDeclarativeForm`, not YAML).

Import `IDeclarativeForm` from `@declarativeforms/types` for type safety.
```

---

## Prompt 6: Edit Tab — Section and Field Builder

```
Build the Edit tab content for the Form Editor in `packages/studio`.

This is the core builder UI where users construct their form by adding sections and fields.

**Create these components**:

1. **src/components/form-builder/form-builder.tsx** — Main builder component that receives the form state and an onChange callback. Layout:
   - Left panel (w-72, border-r): Section list + field list for the active section
   - Right panel (flex-1): Field configuration/properties panel for the selected field

2. **src/components/form-builder/section-list.tsx** — Vertical list of sections:
   - Each section shown as a clickable item with its title (or "Untitled Section" placeholder)
   - Active section highlighted with accent background
   - "Add Section" button at the bottom with Plus icon
   - Clicking a section selects it and shows its fields

3. **src/components/form-builder/field-list.tsx** — List of fields in the currently selected section:
   - Each field shown as a row with: field type icon, label (or "Untitled Field"), and a drag handle placeholder
   - "Add Field" button at the bottom that opens a dialog/dropdown to pick the field type
   - Field type picker should show the available types from `@declarativeforms/types` (use the DECLARATIVE_FIELD_TYPES constant if exported, otherwise reference the types: short_text, long_text, email, number, date, dropdown, single_select, multiple_select, rating, file_upload, url, mobile_number)
   - Clicking a field selects it and shows its properties in the right panel

4. **src/components/form-builder/field-properties.tsx** — Properties panel for the selected field:
   - Field ID (read-only or auto-generated)
   - Label (text input)
   - Placeholder (text input)
   - Field type (select dropdown, pre-filled with current type)
   - Required toggle (checkbox)
   - For dropdown/single_select/multiple_select: an options editor (list of text inputs with add/remove)
   - Empty state when no field is selected: "Select a field to edit its properties"

5. **src/components/form-builder/index.ts** — Barrel export.

Use local component state for the builder's selected section/field. The form data itself should flow from the parent page via props/callbacks. All mutations should produce a new `IDeclarativeForm` object (immutable updates).

Use lucide-react icons for field types (e.g., Type for short_text, AlignLeft for long_text, Mail for email, Hash for number, Calendar for date, ChevronDown for dropdown, Star for rating, etc.).
```

---

## Prompt 7: Preview Tab — Live Form Preview

```
Build the Preview tab for the Form Editor in `packages/studio`.

Reference `packages/core/src/components/form-preview.tsx` closely — the preview should work the same way.

1. **src/components/form-preview.tsx** — Create a FormPreview component that:
   - Receives the current `IDeclarativeForm` object as a prop
   - Uses `compile()` from `@declarativeforms/runtime` and `resolveLocalizedText` from `@declarativeforms/common` to process the form
   - Renders the form using the `DeclarativeForm` component from `packages/core`
   - Handles form effects (complete, redirect) to show completion screen
   - Has a "Restart" button to reset the preview
   - Debounces re-renders (300ms) when the form definition changes

**Important**: The `DeclarativeForm` component lives in `packages/core`. To reuse it in studio, you have two options:
   - **Option A (recommended)**: Copy the necessary components (`DeclarativeForm`, field components, supporting components) into studio. This keeps the packages independent.
   - **Option B**: Extract the form renderer into a shared package. This is cleaner but more work.

Go with **Option A** for now. Copy these from core into studio under `src/components/declarative-form/`:
   - `core/` directory (form.component.tsx, section.component.tsx, field.component.tsx, field-registry.ts, use-runtime.ts)
   - `fields/` directory (all field components)
   - `scaffolding/` directory
   - `supporting/` directory
   - `validation.ts`
   - Also copy `src/lib/theme.ts` from core

Also copy the shadcn `form.tsx` UI component if not already present, as the form components depend on it.

Wire the Preview tab in the form editor page to render this FormPreview component, passing the current form state.

The preview should show the form exactly as end-users would see it, rendered inside a centered card with the same styling as the core app.
```

---

## Prompt 8: Share Tab and Results Tab

```
Build the Share and Results tabs for the Form Editor in `packages/studio`.

### Share Tab
Create **src/components/share-panel.tsx**:
- Display the form's shareable URL: `https://app.declarativeforms.com/{formId}`
- Show the URL in a read-only input with a "Copy" button next to it that copies to clipboard
- Show a "Copy" success toast/feedback (just change the button text to "Copied!" for 2 seconds)
- Below the URL, show an embed code section with an iframe snippet:
  `<iframe src="https://app.declarativeforms.com/{formId}?embed=true" width="100%" height="600" frameborder="0"></iframe>`
- Also provide a QR code placeholder (just a bordered box saying "QR Code" for now)
- Use a clean, centered layout with Card components for each section

### Results Tab
Create **src/components/results-panel.tsx**:
- Display a table of mock submission results
- Create mock submissions in `src/lib/mock-data.ts`: 5-10 submissions with fields matching the mock form (name, email, etc.) plus metadata (submitted_at, status: "completed" | "partial")
- Table columns: Submission ID (truncated), submitted date, status badge, and one or two key field values
- Above the table: total count ("12 responses") and an "Export" button (non-functional placeholder)
- Clicking a row expands to show all field values for that submission, or opens a detail dialog
- Empty state when no submissions: "No responses yet" with a subtle illustration placeholder

Use shadcn Table components if available, otherwise build a simple table with Tailwind. Follow the same visual patterns as the rest of the studio app.
```

---

## Prompt 9: New Form Creation Flow

```
Implement the "New Form" creation flow in `packages/studio`.

When a user clicks "New Form" on the dashboard:

1. Navigate to `/forms/new`
2. The FormEditorPage should detect `formId === "new"` and initialize with a blank form template:
   ```typescript
   const blankForm: IDeclarativeForm = {
     title: "Untitled Form",
     description: "",
     sections: [
       {
         id: "section_1",
         title: "Section 1",
         fields: [],
         next: "done",
       },
     ],
     completion: {
       title: "Thank you!",
       message: "Your response has been recorded.",
     },
   }
   ```

3. The form should be immediately editable — user can rename, add fields, etc.

4. Also add a "Delete" button (with confirmation dialog) in the form editor top bar — for existing forms only, not for new ones. This is a placeholder for now (just removes from mock data and navigates back to dashboard).

5. Add a duplicate form action — a button or menu item in the form editor top bar that creates a copy of the current form and navigates to the new copy.

Keep everything using mock data / local state for now. No API calls.
```

---

## Prompt 10: API Endpoints for Studio

```
Add the API endpoints needed to support the Studio app to `packages/api`.

Reference the existing route patterns in `packages/api/src/` (Fastify route objects, service layer, repository layer).

### New Collections
Add a `studio_forms` MongoDB collection (separate from the existing `forms` collection which tracks GitHub-sourced forms)

### New Endpoints
Add these routes under `/api/v1/studio/`:

1. **GET /api/v1/studio/forms** — List all studio forms

2. **POST /api/v1/studio/forms** — Create a new form

3. **GET /api/v1/studio/forms/:id** — Get a single form

4. **PUT /api/v1/studio/forms/:id** — Update a form

5. **DELETE /api/v1/studio/forms/:id** — Delete a form

6. **GET /api/v1/studio/forms/:id/submissions** — List submissions for a studio form

### File Structure
- `src/studio/routes/forms.ts` — Route definitions
- `src/studio/services/forms.ts` — Business logic
- `src/studio/repositories/forms.ts` — MongoDB operations

Register the new routes in `src/server.ts`.

No authentication for now — that will come later. Keep the implementation simple and consistent with the existing API patterns.
```

---

## Prompt 11: Wire Studio Frontend to API

```
Replace all mock data in `packages/studio` with real API calls.

1. **src/lib/api.ts** — Create an API client (same pattern as `packages/core/src/lib/api.ts`):
   - `getBackendUrl(path)` helper reading from `VITE_API_BASE_URL` env var
   - Default to the same DigitalOcean API URL as core

2. **src/hooks/use-forms.ts** — React Query hooks:
   - `useForms()` — Fetches `GET /studio/forms`, returns list
   - `useForm(id)` — Fetches `GET /studio/forms/:id`, returns single form
   - `useCreateForm()` — Mutation for `POST /studio/forms`
   - `useUpdateForm()` — Mutation for `PUT /studio/forms/:id`
   - `useDeleteForm()` — Mutation for `DELETE /studio/forms/:id`
   - `useSubmissions(formId)` — Fetches `GET /studio/forms/:id/submissions`

3. **Update Dashboard page**:
   - Replace mock data with `useForms()` hook
   - Show loading skeleton while fetching
   - "New Form" button calls `useCreateForm()` then navigates to the new form's editor

4. **Update Form Editor page**:
   - Load form with `useForm(formId)`
   - Auto-save on changes with debounce (1 second) using `useUpdateForm()`
   - Show "Saving..." / "Saved" indicator in the top bar
   - Delete button calls `useDeleteForm()` and navigates to dashboard

5. **Update Results tab**:
   - Replace mock submissions with `useSubmissions(formId)`
   - Show loading state

6. Remove `src/lib/mock-data.ts` once all references are replaced.

Add a `.env` file to `packages/studio` with `VITE_API_BASE_URL=http://localhost:3000/api/v1` for local development.
```
