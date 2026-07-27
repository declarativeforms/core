import {
  parseFormDefinition,
  sanitizeFormDefinition,
  validateFormDefinition,
} from './form-definition';

const validForm = {
  title: 'Contact us',
  sections: [
    {
      id: 'contact',
      fields: [
        {
          id: 'email',
          type: 'email',
        },
      ],
      next: 'done',
    },
  ],
};

describe('form definition validation', () => {
  test('accepts a small valid definition', () => {
    expect(parseFormDefinition(validForm)).toEqual(validForm);
  });

  test('reports duplicate IDs, unsupported fields, and broken navigation', () => {
    const errors = validateFormDefinition({
      sections: [
        {
          id: 'contact',
          fields: [
            { id: 'name', type: 'short_text' },
            { id: 'name', type: 'made_up' },
          ],
          next: 'missing',
        },
        {
          id: 'contact',
          fields: [],
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        'sections[1].id must be unique',
        'sections[0].fields[1].id must be unique',
        'sections[0].fields[1].type is not supported',
        'sections[0].next references unknown section "missing"',
      ]),
    );
  });

  test('removes fields controlled by the server', () => {
    expect(
      sanitizeFormDefinition({
        ...validForm,
        id: 'supplied',
        created_at: 'supplied',
        updated_at: 'supplied',
        collaborators: ['supplied'],
      }),
    ).toEqual(validForm);
  });
});
