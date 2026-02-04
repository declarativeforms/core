

**Context:**
Refactor the styling of the `declarative-forms` directory in a React/Shadcn UI project to match a specific "Mobile-First" design system. The goal is to update typography, spacing, and touch targets without altering business logic or the base Shadcn UI definitions (`components/ui/*`).

**Constraint Checklist:**

1. **Target Directory:** ONLY modify files within `declarative-forms` (or the equivalent feature directory).
2. **Shadcn Integrity:** DO NOT modify base components in `components/ui`. Apply styles via `className` overrides on the instances.
3. **Preservation:** Retain all existing logic, colors, borders, and functional styling (e.g., focus states, error states) unless explicitly replaced by the specs below.
4. **Responsive Strategy:** Mobile styles are default; Desktop styles use `md:` prefix.

---

## **Design Specification (Source of Truth)**

Apply these specific Tailwind utility classes. If a component (like Multi-select) differs structurally, map the *intent* (height, font size, padding) to its trigger/container.

### **1. Layout & Container**

* **Wrapper:** `w-full max-w-2xl mx-auto px-6 md:px-0 py-8 md:mt-20`
* **Field Group Spacing:** `space-y-6` (Vertical distance between questions)

### **2. Typography (Headings)**

* **Main Heading:** `text-3xl md:text-4xl font-bold leading-tight`
* **Subheading:** `text-lg md:text-xl font-normal leading-relaxed text-gray-600`
* **Spacing (Heading → Subheading):** `mt-3 md:mt-4`
* **Spacing (Subheading → First Field):** `mt-8 md:mt-10`

### **3. Inputs & Controls (The "Answer" Fields)**

* **Font:** `text-base` (Prevents iOS zoom)
* **Line Height:** `leading-normal`
* **Touch Target:** `py-3 px-4` (Target height ~48px)
* **Special Handling (Select/Multi-select):** Apply `min-h-[48px]` or equivalent padding to the Trigger component to match the height of standard text inputs.

### **4. Buttons (Navigation)**

* **Container:** `mt-10 md:mt-12 flex justify-between items-center`
* **Dimensions:** `h-12 px-6`
* **Typography:** `text-base font-semibold leading-none`

---

## **Execution Plan**

### **Phase 1: Analysis & Mapping**

1. **Scan** the `declarative-forms` directory to identify:
* The main Layout/Container component.
* The generic Field Wrapper component (if exists).
* Individual field components (`Input`, `Textarea`, `Select`, `MultiSelect`).


2. **Map** the Design Specification classes to the specific `className` props of these components.

### **Phase 2: Layout Implementation**

1. Locate the main form container (e.g., `FormLayout` or `PageWrapper`).
2. Apply the **Container** classes to the root element.
3. Apply the **Typography** classes to the Title and Description elements.
4. Ensure the `space-y-6` utility is applied to the parent container of the list of fields.

### **Phase 3: Component Styling (Iterative)**

*Iterate through field types found in `declarative-forms`:*

1. **Standard Input / Textarea:**
* Pass the **Inputs & Controls** classes (`text-base leading-normal py-3 px-4`) to the Shadcn `Input` instance via `className`.
* *Note:* Ensure `h-auto` or `h-12` is set if Shadcn defaults conflict with the `py-3` padding.


2. **Select / Multi-Select / DatePicker:**
* Target the `Trigger` component.
* Force the height and font size to match standard inputs (`h-12`, `text-base`, `px-4`).
* Ensure the internal text aligns center vertically.


3. **Boolean/Checkbox Groups:**
* Ensure the wrapper respects the `space-y-6` flow.
* Adjust label typography to `text-base` if currently smaller.



### **Phase 4: Navigation & Cleanup**

1. Locate the "Back" and "Next" buttons.
2. Apply the **Buttons** classes (`h-12`, `px-6`, `text-base`).
3. Verify the `mt-10 md:mt-12` margin is applied to the button container.

### **Phase 5: Final Review**

1. Verify "Mobile First" behavior: Check if `md:` classes are stripping correctly on small screens.
2. Verify "No Regression": Ensure standard Shadcn borders, rings, and focus states remain visible.

---