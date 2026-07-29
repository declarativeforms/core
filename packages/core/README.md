# @declarativeforms/core

Framework-independent YAML parsing, active-section compilation, validation, and navigation.

```ts
import {
  compileFormView,
  parseFormYaml,
  validateFormDefinition,
  validateFormData,
} from "@declarativeforms/core";

const definition = parseFormYaml(yamlSource);
const errors = validateFormDefinition(definition);
const submissionErrors = validateFormData(definition, formData, {
  completed: true,
});
const view = compileFormView(definition, "en", {}, "contact");
```

`FormView` contains one compiled section. Create a stateful form flow with
`createFormRuntime()` or the pure `createRuntimeState()` and
`transitionRuntime()` functions. Validate untrusted definitions before
compilation and validate submitted data again on the server; browser validation
is only user feedback.
