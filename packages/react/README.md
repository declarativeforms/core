# @declarativeforms/react

React rendering components for `@declarativeforms/core`.

```tsx
import {
  FormRenderer,
  type DeclarativeFieldComponentProps,
} from "@declarativeforms/react";
import "@declarativeforms/react/styles.css";

function CustomShortText(props: DeclarativeFieldComponentProps) {
  return <input {...props.controllerField} />;
}

<FormRenderer
  definition={definition}
  locale="en"
  initialData={{}}
  formId={definition.id!}
  apiBaseUrl="/api/v1"
  components={{ short_text: CustomShortText }}
  onEffect={handleEffect}
/>;
```

Use `FormViewRenderer` when the host owns runtime state and already has an
active `FormView`. `FormRenderer` resets when its definition or initial data
changes. Upload and email-verification requests are instance-scoped through
`formId` and `apiBaseUrl`; there is no module-global API configuration.
Navigation waits for `onEffect` and for renderer-owned uploads to finish.
Use `onFieldError` to send custom-renderer failures to host diagnostics without
crashing the rest of the form.
