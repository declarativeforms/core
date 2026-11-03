import { validateDefinition } from './forms';

test('validates the existing form schema including ordinary webhook connections', () => {
  const definition = {
    sections: [{ id: 'contact', fields: [{ id: 'email', type: 'email' }] }],
    connections: [{ type: 'webhook', url: 'https://hooks.example.com/forms' }],
  };

  expect(validateDefinition(definition)).toEqual([]);
  expect(
    validateDefinition({ ...definition, sections: 'invalid' }).length,
  ).toBeGreaterThan(0);
});
