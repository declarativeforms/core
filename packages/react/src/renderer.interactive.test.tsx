/** @jest-environment jsdom */

import type { FormDefinition, FormEffect } from '@declarativeforms/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { DeclarativeFieldRenderer } from './index';
import { FormRenderer } from './index';

const ControlledText = (({ controllerField, field }) => (
  <input
    {...controllerField}
    aria-label={field.label}
    value={String(controllerField.value ?? '')}
  />
)) as DeclarativeFieldRenderer;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  Object.defineProperty(window, 'scrollTo', {
    configurable: true,
    value: jest.fn(),
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  } else {
    Reflect.deleteProperty(globalThis, 'fetch');
  }
});

test('resets when the definition and initial data change', async () => {
  const first: FormDefinition = {
    sections: [
      {
        id: 'first',
        fields: [{ id: 'name', type: 'short_text', label: 'First name' }],
      },
    ],
  };
  const second: FormDefinition = {
    sections: [
      {
        id: 'second',
        fields: [{ id: 'company', type: 'short_text', label: 'Company' }],
      },
    ],
  };
  const { rerender } = render(
    <FormRenderer
      definition={first}
      locale="en"
      initialData={{ name: 'Ada' }}
      components={{ short_text: ControlledText }}
      onEffect={() => undefined}
    />,
  );

  expect((screen.getByLabelText('First name') as HTMLInputElement).value).toBe(
    'Ada',
  );

  rerender(
    <FormRenderer
      definition={second}
      locale="en"
      initialData={{ company: 'Analytical Engines' }}
      components={{ short_text: ControlledText }}
      onEffect={() => undefined}
    />,
  );

  await waitFor(() => {
    expect((screen.getByLabelText('Company') as HTMLInputElement).value).toBe(
      'Analytical Engines',
    );
  });
  expect(screen.queryByLabelText('First name')).toBeNull();
});

test('keeps the current section and answer when persistence fails', async () => {
  const definition: FormDefinition = {
    sections: [
      {
        id: 'first',
        fields: [{ id: 'name', type: 'short_text', label: 'Name' }],
        next: 'second',
      },
      {
        id: 'second',
        fields: [{ id: 'notes', type: 'long_text', label: 'Notes' }],
        next: 'done',
      },
    ],
  };
  render(
    <FormRenderer
      definition={definition}
      locale="en"
      initialData={{}}
      components={{ short_text: ControlledText }}
      onEffect={async () => {
        throw new Error('Save failed');
      }}
    />,
  );

  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Grace' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));

  expect((await screen.findByRole('alert')).textContent).toContain(
    'We could not save your response',
  );
  expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
    'Grace',
  );
  expect(screen.queryByLabelText('Notes')).toBeNull();
});

test('hydrates and appends several uploaded files without losing values', async () => {
  const definition: FormDefinition = {
    id: 'f123456789abc',
    sections: [
      {
        id: 'files',
        fields: [
          {
            id: 'documents',
            type: 'file_upload',
            label: 'Documents',
            validators: [{ type: 'max', value: 3 }],
          },
        ],
        next: 'done',
      },
    ],
  };
  const onEffect = jest.fn(
    async (
      _effect: FormEffect,
      _state: {
        activeSectionId: string;
        data: Record<string, unknown>;
      },
    ) => undefined,
  );
  const responses = [
    { token: 'upload-token' },
    { url: '/api/v1/files/uploads/f123456789abc/one.pdf' },
    { url: '/api/v1/files/uploads/f123456789abc/two.pdf' },
  ];
  const fetchMock = jest.fn(async () => {
    const payload = responses.shift();
    return {
      json: async () => payload,
      ok: true,
      status: 200,
    } as Response;
  });
  globalThis.fetch = fetchMock as typeof fetch;

  render(
    <FormRenderer
      definition={definition}
      locale="en"
      initialData={{
        documents: ['/api/v1/files/uploads/f123456789abc/restored.pdf'],
      }}
      formId="f123456789abc"
      onEffect={onEffect}
    />,
  );

  fireEvent.change(screen.getByLabelText('Documents'), {
    target: {
      files: [
        new File(['one'], 'one.pdf', { type: 'application/pdf' }),
        new File(['two'], 'two.pdf', { type: 'application/pdf' }),
      ],
    },
  });

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  await waitFor(() => {
    expect(
      (screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));

  await waitFor(() => expect(onEffect).toHaveBeenCalledTimes(1));
  expect(onEffect.mock.calls[0]?.[1]?.data.documents).toEqual([
    '/api/v1/files/uploads/f123456789abc/restored.pdf',
    '/api/v1/files/uploads/f123456789abc/one.pdf',
    '/api/v1/files/uploads/f123456789abc/two.pdf',
  ]);
});
