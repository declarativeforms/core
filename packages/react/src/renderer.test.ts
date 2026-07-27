import {
  createFieldComponentRegistry,
  defaultFieldComponents,
  FormRenderer,
  HtmlText,
  type DeclarativeFieldRenderer,
} from './index';
import type { FormDefinition } from '@declarativeforms/core';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('merges custom visual components over the defaults', () => {
  const CustomShortText = (() => null) as DeclarativeFieldRenderer;
  const registry = createFieldComponentRegistry({
    short_text: CustomShortText,
  });

  expect(registry.short_text).toBe(CustomShortText);
  expect(registry.email).toBe(defaultFieldComponents.email);
});

test('renders definition text without interpreting HTML', () => {
  const markup = renderToStaticMarkup(
    createElement(HtmlText, {
      html: 'Hello <img src=x onerror="alert(1)">',
    }),
  );

  expect(markup).toContain(
    'Hello &lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
  );
  expect(markup).not.toContain('<img');
});

test('renders a compiled form section with a custom field component', () => {
  const definition: FormDefinition = {
    title: 'Contact us',
    sections: [
      {
        id: 'contact',
        title: 'Contact details',
        fields: [
          {
            id: 'name',
            type: 'short_text',
            label: 'Your name',
          },
        ],
      },
    ],
  };
  const CustomShortText = (({ field }) =>
    createElement('input', {
      'aria-label': field.label,
      'data-custom-field': field.id,
    })) as DeclarativeFieldRenderer;

  const markup = renderToStaticMarkup(
    createElement(FormRenderer, {
      definition,
      locale: 'en',
      initialData: {},
      components: { short_text: CustomShortText },
      onEffect: () => undefined,
    }),
  );

  expect(markup).toContain('aria-label="Contact details"');
  expect(markup).toContain('data-custom-field="name"');
  expect(markup).toContain('Next');
});
