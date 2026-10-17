import assert from 'node:assert/strict';
import test from 'node:test';
import { applyFormTheme, buildThemeStyle } from './src/lib/theme.ts';

test('custom accents normalize hex and choose a contrasting foreground', () => {
  assert.equal(buildThemeStyle(undefined), undefined);
  assert.equal(buildThemeStyle({ primary: 'invalid' }), undefined);
  assert.equal(buildThemeStyle({ primary: '#12345678' }), undefined);
  assert.deepEqual(buildThemeStyle({ primary: 'abc' }), {
    '--primary': '#abc',
    '--primary-foreground': '#000000',
    '--ring': '#abc',
  });
  assert.equal(
    buildThemeStyle({ primary: '#542EBC' })['--primary-foreground'],
    '#ffffff',
  );
  assert.equal(
    buildThemeStyle({ primary: '#999999' })['--primary-foreground'],
    '#000000',
  );
});

test('form appearance follows auto only and restores document state on cleanup', () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const attributes = new Map();
  const styles = new Map([['--unrelated', ['preserved', '']]]);
  const listeners = new Set();
  let requests = 0;
  const preference = {
    matches: true,
    addEventListener: (event, listener) => {
      assert.equal(event, 'change');
      listeners.add(listener);
    },
    removeEventListener: (event, listener) => {
      assert.equal(event, 'change');
      listeners.delete(listener);
    },
  };
  globalThis.document = {
    documentElement: {
      getAttribute: (name) => attributes.get(name) ?? null,
      setAttribute: (name, value) => attributes.set(name, value),
      removeAttribute: (name) => attributes.delete(name),
      style: {
        getPropertyValue: (name) => styles.get(name)?.[0] ?? '',
        getPropertyPriority: (name) => styles.get(name)?.[1] ?? '',
        setProperty: (name, value, priority = '') =>
          styles.set(name, [value, priority]),
        removeProperty: (name) => styles.delete(name),
      },
    },
  };
  globalThis.window = {
    matchMedia: (query) => {
      assert.equal(query, '(prefers-color-scheme: dark)');
      requests++;
      return preference;
    },
  };

  try {
    for (const mode of [undefined, 'light', 'dark']) {
      const cleanup = applyFormTheme(mode ? { mode } : undefined);
      assert.equal(attributes.get('data-form-theme'), mode ?? 'light');
      assert.equal(requests, 0);
      assert.equal(listeners.size, 0);
      cleanup();
      assert.equal(attributes.has('data-form-theme'), false);
    }

    attributes.set('data-form-theme', 'light');
    styles.set('--primary', ['#123456', 'important']);
    const cleanup = applyFormTheme({ mode: 'auto', primary: 'abc' });
    assert.equal(attributes.get('data-form-theme'), 'dark');
    assert.equal(listeners.size, 1);
    assert.deepEqual(styles.get('--primary'), ['#abc', '']);
    preference.matches = false;
    for (const listener of listeners) listener();
    assert.equal(attributes.get('data-form-theme'), 'light');
    preference.matches = true;
    for (const listener of listeners) listener();
    assert.equal(attributes.get('data-form-theme'), 'dark');
    cleanup();
    assert.equal(listeners.size, 0);
    assert.equal(attributes.get('data-form-theme'), 'light');
    assert.deepEqual(styles.get('--primary'), ['#123456', 'important']);
    assert.equal(styles.has('--primary-foreground'), false);
    assert.equal(styles.has('--ring'), false);
    assert.deepEqual(styles.get('--unrelated'), ['preserved', '']);

    const cleanupNextForm = applyFormTheme({ mode: 'dark' });
    assert.equal(attributes.get('data-form-theme'), 'dark');
    assert.equal(listeners.size, 0);
    cleanupNextForm();
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});
