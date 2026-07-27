# @declarativeforms/core

Framework-independent YAML parsing, active-section compilation, validation, and navigation.

```ts
import {
  compileFormView,
  parseFormYaml,
  validateFormDefinition,
} from "@declarativeforms/core";

const definition = parseFormYaml(yamlSource);
const errors = validateFormDefinition(definition);
const view = compileFormView(definition, "en", {}, "contact");
```

`FormView` contains one compiled section. Create a stateful form flow with
`createFormRuntime()` or the pure `createRuntimeState()` and
`transitionRuntime()` functions.
