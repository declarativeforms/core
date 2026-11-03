import { validateDefinition } from './forms';

test('validates the authoring schema and requires explicit webhook configuration', () => {
  const original = process.env.MCP_WEBHOOK_URLS;
  const definition = {
    sections: [{ id: 'contact', fields: [{ id: 'email', type: 'email' }] }],
    connections: [{ type: 'webhook', url: 'https://hooks.example.com/forms' }],
  };

  try {
    delete process.env.MCP_WEBHOOK_URLS;
    expect(validateDefinition(definition)).toEqual([
      expect.objectContaining({ instancePath: '/connections/0/url' }),
    ]);
    process.env.MCP_WEBHOOK_URLS = 'https://hooks.example.com/forms';
    expect(validateDefinition(definition)).toEqual([]);
    expect(
      validateDefinition({ ...definition, sections: 'invalid' }).length,
    ).toBeGreaterThan(0);
    expect(
      validateDefinition({
        ...definition,
        connections: [
          { type: 'webhook', url: 'https://hooks.example.com/forms/other' },
        ],
      }).length,
    ).toBeGreaterThan(0);
  } finally {
    if (original === undefined) {
      delete process.env.MCP_WEBHOOK_URLS;
    } else {
      process.env.MCP_WEBHOOK_URLS = original;
    }
  }
});
