import { DECLARATIVE_CONNECTION_TYPES } from './types/schema/connection-type';
import { DECLARATIVE_FIELD_TYPES } from './types/schema/field-type';

/**
 * The published JSON Schema for a Declarative Forms YAML definition.
 *
 * This module is the single source of truth for the authored schema as seen by
 * the outside world: validators, editors, LLMs, and coding agents all read the
 * emitted `schema.json`. Enums are spread from the canonical tuples in
 * `types/schema/`, so they cannot drift from the engine.
 *
 * `parse()` performs no validation (the YAML is trusted), which makes this file
 * the only place an authoring mistake is ever reported. Descriptions therefore
 * carry the runtime semantics a type signature cannot express: which validators
 * a given field type actually honours, which are silently discarded, and where
 * the engine applies an implicit rule of its own.
 *
 * Draft-07 is deliberate. It is what `yaml-language-server`, ajv, and Monaco
 * support best, and it has everything this schema needs.
 */

/** A JSON Schema node. Loose by design: this module emits data, not types. */
type JsonSchemaNode = Record<string, unknown>;

/**
 * Field types grouped by the extra properties they accept.
 *
 * Each group becomes one closed branch of `definitions.field.oneOf`. The union
 * of every group must equal `DECLARATIVE_FIELD_TYPES` exactly; that invariant is
 * asserted by `assertFieldTypeCoverage` and enforced at build time, so adding a
 * field type without giving it a branch here fails the build.
 */
const FIELD_TYPE_GROUPS = {
  generic: [
    'short_text',
    'long_text',
    'mobile_number',
    'url',
    'number',
    'date',
    'date_month',
    'time',
    'signature',
    'hidden',
  ],
  email: ['email'],
  dropdown: ['dropdown'],
  select: ['single_select', 'multiple_select'],
  rating: ['rating'],
  address: [
    'address',
    'address_locality',
    'address_region',
    'address_country',
  ],
  camera: ['camera'],
  fileUpload: ['file_upload'],
  geolocation: ['geolocation'],
} as const;

/** `{ allOf: [$ref] }` so the sibling description is honoured under draft-07. */
function ref(name: string, description: string): JsonSchemaNode {
  return {
    allOf: [{ $ref: `#/definitions/${name}` }],
    description,
  };
}

/**
 * Properties every field shares, mirroring `FormFieldBase` in
 * `types/schema/model.ts`. Spread into each branch because
 * `additionalProperties: false` does not compose through `allOf`.
 */
const fieldBaseProperties: Record<string, JsonSchemaNode> = {
  id: ref(
    'identifier',
    'Key the answer is stored under. Referenced in expressions as `data.<id>` and in templates as `{{data.<id>}}`. Also the query-parameter name used to prefill this field from the URL.',
  ),
  label: ref('localizedText', "The field's label. Supports templating."),
  placeholder: ref(
    'localizedText',
    'Placeholder text, where the input supports one. Supports templating.',
  ),
  validators: {
    type: 'array',
    description:
      'Validation rules, run in order. The first failure is the message shown.',
    items: { $ref: '#/definitions/validator' },
  },
  visible_when: ref(
    'expression',
    'The field is shown only while this expression is truthy, re-evaluated as the respondent types. A value entered before the field was hidden is still submitted: hiding a field does not clear its answer.',
  ),
};

function fieldBranch(
  types: readonly string[],
  description: string,
  extraProperties: Record<string, JsonSchemaNode> = {},
): JsonSchemaNode {
  return {
    type: 'object',
    description,
    additionalProperties: false,
    required: ['id', 'type'],
    properties: {
      type: { enum: [...types] },
      ...fieldBaseProperties,
      ...extraProperties,
    },
  };
}

const optionsProperty: JsonSchemaNode = {
  type: 'array',
  description:
    'The choices offered. Each entry is either a plain string (used as both label and value) or an object with a separate `label` and `value`.',
  items: { $ref: '#/definitions/option' },
};

const fieldBranches: JsonSchemaNode[] = [
  fieldBranch(
    FIELD_TYPE_GROUPS.generic,
    'A field that takes no properties beyond the shared base. `short_text` is a single-line input, `long_text` a textarea, `mobile_number` a tel input, `url` a URL input, `number` a numeric input, `date`/`date_month`/`time` are pickers, `signature` is a draw-to-sign pad, and `hidden` captures a value without rendering anything (typically prefilled from the URL). Note: `number` gets an implicit `^\\d+$` whole-number check unless you supply your own `pattern` validator, so negatives and decimals need one. `date`, `date_month`, `time`, and `number` honour `min`/`max`; the rest honour only `min_length`/`max_length`.',
  ),
  fieldBranch(
    FIELD_TYPE_GROUPS.email,
    'An email input. There is no implicit format check on either the client or the server: add a `pattern` validator if you need one.',
  ),
  fieldBranch(
    FIELD_TYPE_GROUPS.dropdown,
    'A select menu.',
    {
      options: optionsProperty,
      searchable: {
        type: 'boolean',
        default: false,
        description: 'Adds a search box to the menu. Useful past ~10 options.',
      },
    },
  ),
  fieldBranch(
    FIELD_TYPE_GROUPS.select,
    'A choice field. `single_select` renders radio-style and stores a string; `multiple_select` renders checkbox-style and stores an array. On `multiple_select`, `min`/`max` validators bound the number of selections, not a value.',
    {
      options: optionsProperty,
      allow_other: {
        type: 'boolean',
        default: false,
        description: 'Adds a free-text "Other" choice.',
      },
    },
  ),
  fieldBranch(
    FIELD_TYPE_GROUPS.rating,
    'A rating scale, 1 to 5 by default. On this type `min`/`max` validators define the scale itself rather than only validating it. A `min` below 1, or a `max` below `min`, is ignored and the 1..5 default is used.',
    {
      min_label: ref(
        'localizedText',
        'Caption under the low end of the scale, for example "Novice".',
      ),
      max_label: ref(
        'localizedText',
        'Caption under the high end of the scale, for example "Expert".',
      ),
    },
  ),
  fieldBranch(
    FIELD_TYPE_GROUPS.address,
    'An address autocomplete. `address` captures a full address, `address_locality` a city, `address_region` a state or region, and `address_country` a country. Backed by Google Places when `VITE_GOOGLE_MAPS_API_KEY` is configured, falling back to plain text entry when it is not, so the field always works.',
    {
      outputFormat: {
        enum: ['string', 'structured'],
        default: 'string',
        description:
          '`string` stores the formatted address as one string. `structured` stores an object with `formatted_address`, `place_id`, and where available `street_number`, `route`, `locality`, `administrative_area_level_1`, `country`, and `postal_code`. Note the camelCase spelling: this is the one authored property that is not snake_case.',
      },
    },
  ),
  fieldBranch(
    FIELD_TYPE_GROUPS.camera,
    'A live camera capture.',
    {
      facing_mode: {
        enum: ['front', 'rear'],
        default: 'rear',
        description: 'Which camera to open by default.',
      },
    },
  ),
  fieldBranch(
    FIELD_TYPE_GROUPS.fileUpload,
    'A file picker. Files are uploaded to the configured S3-compatible bucket and the answer holds their URLs. `min`/`max` validators bound the number of files, not their size. The per-file size cap is server configuration, not part of this schema.',
    {
      accepted_mime_types: {
        type: 'array',
        description:
          'MIME types the picker accepts, for example `application/pdf` or `image/*`. Enforced in the browser only: the server accepts any type.',
        items: {
          type: 'string',
          pattern: '^[a-zA-Z0-9!#$&^_.+-]+/([a-zA-Z0-9!#$&^_.+-]+|\\*)$',
        },
        examples: [['application/pdf', 'image/png', 'image/jpeg']],
      },
    },
  ),
  fieldBranch(
    FIELD_TYPE_GROUPS.geolocation,
    'Captures latitude and longitude with a map preview.',
  ),
];

const validatorBranches: JsonSchemaNode[] = [
  {
    const: 'required',
    description:
      'Shorthand for `{ type: required }`. The field must have a value.',
  },
  {
    type: 'object',
    description: 'The field must have a value.',
    additionalProperties: false,
    required: ['type'],
    properties: {
      type: { const: 'required' },
      message: { $ref: '#/definitions/message' },
    },
  },
  {
    type: 'object',
    description:
      'The value must match this regular expression. Applies to text-like fields. The pattern is not anchored for you, and an empty value passes.',
    additionalProperties: false,
    required: ['type', 'regex'],
    properties: {
      type: { const: 'pattern' },
      regex: {
        type: 'string',
        minLength: 1,
        description:
          'A JavaScript regular expression source string, without delimiters or flags. Remember that YAML needs the backslash doubled in a double-quoted scalar.',
        examples: ['^\\+?[0-9 ()-]{7,20}$'],
      },
      message: { $ref: '#/definitions/message' },
    },
  },
  {
    type: 'object',
    description: 'The value must be at least this many characters.',
    additionalProperties: false,
    required: ['type', 'value'],
    properties: {
      type: { const: 'min_length' },
      value: { type: 'integer', minimum: 0 },
      message: { $ref: '#/definitions/message' },
    },
  },
  {
    type: 'object',
    description: 'The value must be at most this many characters.',
    additionalProperties: false,
    required: ['type', 'value'],
    properties: {
      type: { const: 'max_length' },
      value: { type: 'integer', minimum: 0 },
      message: { $ref: '#/definitions/message' },
    },
  },
  {
    type: 'object',
    description:
      'A lower bound. Honoured only on `number`, `date`, `date_month`, `time`, `rating`, `file_upload`, and `multiple_select`; on any other field type it is silently discarded, so use `min_length` for text. The meaning follows the value: on `multiple_select` and `file_upload` it is a count, on `rating` it sets the bottom of the scale, a numeric bound compares numerically, and a string bound compares lexically (which is what makes `"2026-10-01"` work on a date).',
    additionalProperties: false,
    required: ['type', 'value'],
    properties: {
      type: { const: 'min' },
      value: { type: ['number', 'string'] },
      message: { $ref: '#/definitions/message' },
    },
  },
  {
    type: 'object',
    description:
      'An upper bound. Honoured only on `number`, `date`, `date_month`, `time`, `rating`, `file_upload`, and `multiple_select`; on any other field type it is silently discarded, so use `max_length` for text. The meaning follows the value: on `multiple_select` and `file_upload` it is a count, on `rating` it sets the top of the scale, a numeric bound compares numerically, and a string bound compares lexically.',
    additionalProperties: false,
    required: ['type', 'value'],
    properties: {
      type: { const: 'max' },
      value: { type: ['number', 'string'] },
      message: { $ref: '#/definitions/message' },
    },
  },
  {
    type: 'object',
    description:
      'The expression must be truthy. Use this for cross-field checks, since the expression sees every answer.',
    additionalProperties: false,
    required: ['type', 'expression'],
    properties: {
      type: { const: 'expression' },
      expression: { $ref: '#/definitions/expression' },
      message: { $ref: '#/definitions/message' },
    },
  },
];

const connectionBranches: JsonSchemaNode[] = [
  {
    type: 'object',
    description:
      'POSTs the whole submission to a URL as JSON. The body is the stored submission: `id`, `form_id`, `status`, `created_at`, `updated_at`, `data`, and `metadata`. Requests are not signed and custom headers are not supported.',
    additionalProperties: false,
    required: ['type', 'url'],
    properties: {
      type: { const: 'webhook' },
      url: {
        type: 'string',
        format: 'uri',
        pattern: '^https?://',
        description:
          'Where to POST. Note this is readable by anyone who can load the form definition.',
      },
      when: { $ref: '#/definitions/connectionWhen' },
      trigger_on: { $ref: '#/definitions/triggerOn' },
      delay_minutes: { $ref: '#/definitions/delayMinutes' },
    },
  },
  {
    type: 'object',
    description:
      'Sends an email through Resend. Requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL` on the server.',
    additionalProperties: false,
    required: ['type', 'to', 'subject'],
    properties: {
      type: { const: 'email' },
      to: {
        type: 'string',
        minLength: 1,
        description:
          'Recipient address. Supports templating, so it can be routed to an address the respondent gave. The connection is skipped if this resolves to an empty string.',
        examples: ['team@example.com', '{{data.email}}'],
      },
      subject: ref(
        'localizedText',
        'Email subject. Supports templating. The connection is skipped if this resolves to an empty string.',
      ),
      body: ref(
        'localizedText',
        'Email body. Supports templating, and is sent as HTML without escaping.',
      ),
      include_responses: {
        type: 'boolean',
        default: false,
        description:
          'Append a table of every answer to the email. `hidden` fields are left out.',
      },
      when: { $ref: '#/definitions/connectionWhen' },
      trigger_on: { $ref: '#/definitions/triggerOn' },
      delay_minutes: { $ref: '#/definitions/delayMinutes' },
    },
  },
];

const completionProperties: Record<string, JsonSchemaNode> = {
  title: ref('localizedText', 'Heading on the completion screen.'),
  message: ref('localizedText', 'Body text on the completion screen.'),
  button: ref('button', 'An optional call to action.'),
};

export const FORM_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://frms.dev/schema.json',
  title: 'Declarative Forms',
  description:
    'A form definition. One YAML file describes the whole form: its sections, its fields, how it branches, what the respondent sees when they finish, and what happens to the submission. Commit it to a repository and it is served at https://frms.dev/<owner>/<repo>/<path-without-.yaml>.',
  type: 'object',
  additionalProperties: false,
  required: ['sections'],
  properties: {
    version: {
      type: 'integer',
      default: 1,
      description: 'Schema version. Use `1`.',
      examples: [1],
    },
    title: ref(
      'localizedText',
      'Form title, shown at the top and used as the document title. Supports templating.',
    ),
    description: ref(
      'localizedText',
      'Short description under the title. Supports templating.',
    ),
    locale: {
      type: 'string',
      pattern: '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$',
      description:
        'Default language for localized text, for example `en`. A respondent can override it with `?lang=`. Note the surrounding interface (buttons, validation messages) currently ships translations for `en` and `es` only; your own localized text may use any language code.',
      examples: ['en', 'de', 'pt-BR'],
    },
    start_date: ref(
      'dateString',
      'Before this date the form is closed and shows a not-yet-open notice. Enforced in the browser only: a direct API submission is not blocked.',
    ),
    end_date: ref(
      'dateString',
      'After this date the form is closed and shows a closed notice. Enforced in the browser only: a direct API submission is not blocked.',
    ),
    theme: { $ref: '#/definitions/theme' },
    measurements: { $ref: '#/definitions/measurements' },
    sections: {
      type: 'array',
      minItems: 1,
      description:
        'The body of the form. Each section is one page, submitted as a step. A form must have at least one.',
      items: { $ref: '#/definitions/section' },
    },
    completion: {
      description:
        'The screen shown after the form is finished. Either one screen, or a list of rules where the first matching `when` wins.',
      oneOf: [
        { $ref: '#/definitions/completion' },
        {
          type: 'array',
          minItems: 1,
          items: { $ref: '#/definitions/completionRule' },
        },
      ],
      examples: [
        {
          title: 'Thanks, {{data.full_name}}',
          message: 'We will reply to {{data.email}}.',
        },
      ],
    },
    connections: {
      type: 'array',
      description:
        'Webhooks and emails fired when a submission is saved. Queued and delivered by a scheduler, so delivery is asynchronous.',
      items: { $ref: '#/definitions/connection' },
    },
  },
  definitions: {
    localizedText: {
      description:
        'Either a plain string, or a map of language code to translated string. Resolution order is the active locale, then its base language, then `en`, then the first non-empty value.',
      oneOf: [
        { type: 'string' },
        {
          type: 'object',
          minProperties: 1,
          propertyNames: { pattern: '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$' },
          additionalProperties: { type: 'string' },
        },
      ],
      examples: ['Contact us', { en: 'Contact us', de: 'Kontaktiere uns' }],
    },
    message: {
      allOf: [{ $ref: '#/definitions/localizedText' }],
      description:
        'Overrides the default error text for this rule. Omit it to use the built-in message, which names the field.',
    },
    identifier: {
      type: 'string',
      pattern: '^[A-Za-z_][A-Za-z0-9_]*$',
      description:
        'An identifier. Restricted to letters, digits, and underscores because it is dereferenced as `data.<id>` inside expressions and templates, where a hyphen would not parse.',
    },
    dateString: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}([T ].*)?$',
      description: 'A date as `YYYY-MM-DD`.',
      examples: ['2026-10-01'],
    },
    expression: {
      type: 'string',
      minLength: 1,
      description:
        'A JavaScript boolean expression. The only variable in scope is `data`, an object holding every answer keyed by field id. Anything that throws (including reaching through a missing value) evaluates to `false`, so a typo fails closed and silently. Keep these to comparisons and boolean logic.',
      examples: [
        "data.newsletter === 'Yes'",
        "data.age >= 18 && data.country === 'DE'",
      ],
    },
    option: {
      description:
        'A choice. A plain string is used as both the label shown and the value stored.',
      oneOf: [
        { type: 'string' },
        {
          type: 'object',
          additionalProperties: false,
          properties: {
            label: ref('localizedText', 'Shown to the respondent.'),
            value: {
              type: 'string',
              description:
                'Stored in the answer. Defaults to the label when omitted. Unlike a field id this is free-form, so `1-10` or `200+` are fine.',
            },
          },
        },
      ],
      examples: ['General enquiry', { label: '1 to 10 people', value: '1-10' }],
    },
    validator: {
      description:
        'A validation rule. Empty values pass every rule except `required` and count-based `min`/`max`, so an optional field is only flagged once the respondent starts filling it in.',
      oneOf: validatorBranches,
      examples: [
        'required',
        { type: 'min_length', value: 20, message: 'Please write more.' },
      ],
    },
    field: {
      description:
        'A question. `type` selects which extra properties are allowed.',
      oneOf: fieldBranches,
    },
    nextRule: {
      description:
        'One branch of a conditional route. Either a guarded jump or the fallback.',
      oneOf: [
        {
          type: 'object',
          additionalProperties: false,
          required: ['when', 'go'],
          properties: {
            when: { $ref: '#/definitions/expression' },
            go: { $ref: '#/definitions/nextTarget' },
          },
        },
        {
          type: 'object',
          additionalProperties: false,
          required: ['else'],
          properties: {
            else: { $ref: '#/definitions/nextTarget' },
          },
        },
      ],
    },
    nextTarget: {
      type: 'string',
      minLength: 1,
      description:
        'Where to go: the `id` of another section, the literal `done` to finish and show the completion screen, or an absolute `https://` URL to redirect the respondent. Only `https://` is treated as external; an `http://` target is looked up as a section id and will not be found.',
      examples: ['preferences', 'done', 'https://example.com/thanks'],
    },
    section: {
      type: 'object',
      description:
        'One page of the form, validated and saved as a step. Multi-section forms show progress and support conditional routing.',
      additionalProperties: false,
      required: ['id', 'fields'],
      properties: {
        id: ref(
          'identifier',
          'Section identifier. This is what `next` rules target.',
        ),
        title: ref('localizedText', 'Section heading. Supports templating.'),
        fields: {
          type: 'array',
          description: 'The fields on this page.',
          items: { $ref: '#/definitions/field' },
        },
        next: {
          description:
            'What happens once this section is completed. Either a single target, or a list of rules evaluated top to bottom where the first truthy `when` wins and `else` is the fallback. Defaults to finishing the form.',
          oneOf: [
            { $ref: '#/definitions/nextTarget' },
            {
              type: 'array',
              minItems: 1,
              items: { $ref: '#/definitions/nextRule' },
            },
          ],
          examples: [
            'done',
            [
              { when: "data.respondent_type === 'Business'", go: 'organization' },
              { else: 'preferences' },
            ],
          ],
        },
      },
    },
    button: {
      type: 'object',
      description: 'A call to action on the completion screen.',
      additionalProperties: false,
      properties: {
        label: ref('localizedText', 'Button text.'),
        url: ref(
          'localizedText',
          'Where the button goes. Localized text, so it can point at a different page per language.',
        ),
      },
    },
    completion: {
      type: 'object',
      description:
        'The screen shown once the form is finished. `title` and `message` support templating, so they can address the respondent by name.',
      additionalProperties: false,
      properties: completionProperties,
    },
    completionRule: {
      type: 'object',
      description:
        'A completion screen guarded by an expression. Rules are evaluated top to bottom and the first match wins, so a rule with no `when` is the default and must come last.',
      additionalProperties: false,
      properties: {
        ...completionProperties,
        when: ref(
          'expression',
          'Show this screen only when the expression is truthy. Omit it to make this the default.',
        ),
      },
    },
    connectionWhen: {
      allOf: [{ $ref: '#/definitions/expression' }],
      description: 'Only deliver when this expression is truthy.',
    },
    triggerOn: {
      enum: ['completed', 'partial', 'any'],
      default: 'completed',
      description:
        'Which saved submission states trigger delivery. `completed` delivers once, after the final section validates. `partial` delivers after every section save but not on completion. `any` does both. Use `partial` and `any` deliberately: a multi-section form will produce several deliveries for one respondent.',
    },
    delayMinutes: {
      type: 'integer',
      minimum: 0,
      default: 0,
      description:
        'Minutes to wait before delivery. `0` delivers on the scheduler next polling cycle. The connection, form, and submission are snapshotted into the queued job, so later edits to the form do not change work already queued.',
    },
    connection: {
      description: 'Something that happens when a submission is saved.',
      oneOf: connectionBranches,
    },
    theme: {
      type: 'object',
      description: 'Visual customization.',
      additionalProperties: false,
      properties: {
        primary: {
          type: 'string',
          pattern: '^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$',
          description:
            'Accent color, as a 3- or 6-digit hex string. Anything else is ignored and the default theme is used. The contrasting foreground color is derived automatically.',
          examples: ['#542EBC'],
        },
      },
    },
    analyticsProvider: {
      description:
        'A provider token, or an object if you need to name the ingestion host.',
      oneOf: [
        {
          type: 'string',
          minLength: 1,
          description: 'The public project token. Keeps the default host.',
        },
        {
          type: 'object',
          additionalProperties: false,
          required: ['token'],
          properties: {
            token: {
              type: 'string',
              minLength: 1,
              description: "The provider public project token.",
            },
            api_host: {
              type: 'string',
              format: 'uri',
              description:
                'Ingestion host, for another cloud region, a reverse proxy, or a self-hosted instance. Defaults to `https://api-eu.mixpanel.com` for Mixpanel and `https://us.i.posthog.com` for PostHog.',
            },
          },
        },
      ],
    },
    measurements: {
      type: 'object',
      description:
        'Analytics. Each configured provider receives the same two explicit events, `page_view` and `section_completed`. Automatic pageview, click, session-recording, survey, and person-profile collection is switched off.',
      additionalProperties: false,
      minProperties: 1,
      properties: {
        mixpanel: { $ref: '#/definitions/analyticsProvider' },
        posthog: { $ref: '#/definitions/analyticsProvider' },
      },
      examples: [
        { posthog: { token: 'phc_example', api_host: 'https://eu.i.posthog.com' } },
      ],
    },
  },
};

/**
 * Throw unless every canonical field and connection type has exactly one branch.
 *
 * Runs at build time, so adding a type to `DECLARATIVE_FIELD_TYPES` without
 * giving it a schema branch fails the build rather than shipping a schema that
 * silently rejects valid forms.
 */
export function assertJsonSchemaCoverage(): void {
  // Widened to string[] so a newly added field type reaches the checks below
  // and gets a clear message, rather than failing as an assignability error.
  const fields: string[] = Object.values(FIELD_TYPE_GROUPS).flatMap((group) => [
    ...group,
  ]);
  const connections = connectionBranches.map((branch) => {
    const properties = branch.properties as Record<string, JsonSchemaNode>;
    return (properties.type as { const: string }).const;
  });

  const problems = [
    [
      'field types appear in more than one branch',
      fields.filter((type, index) => fields.indexOf(type) !== index),
    ],
    [
      'field types have no branch (add them to FIELD_TYPE_GROUPS)',
      DECLARATIVE_FIELD_TYPES.filter((type) => !fields.includes(type)),
    ],
    [
      'field types are in the schema but unknown to the engine',
      fields.filter(
        (type) => !(DECLARATIVE_FIELD_TYPES as readonly string[]).includes(type),
      ),
    ],
    [
      'connection types have no branch',
      DECLARATIVE_CONNECTION_TYPES.filter(
        (type) => !connections.includes(type),
      ),
    ],
  ] as const;

  for (const [problem, types] of problems) {
    if (types.length > 0) {
      throw new Error(`JSON Schema: ${problem}: ${types.join(', ')}.`);
    }
  }
}
