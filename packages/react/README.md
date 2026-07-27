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
  components={{ short_text: CustomShortText }}
  onEffect={handleEffect}
/>;
```

Use `FormViewRenderer` when the host owns runtime state and already has an
active `FormView`.
